using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly CustomerService _customerService;

    public OrderService(IUnitOfWork unitOfWork, IMapper mapper, CustomerService customerService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _customerService = customerService;
    }

    public async Task<OrderDto> CreateOrderAsync(OrderCreateDto orderDto)
    {
        var items = new List<OrderItem>();
        
        foreach (var itemDto in orderDto.Items)
        {
            var productSpec = new ProductsWithCategoriesSpecification(itemDto.ProductId);
            var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec(productSpec);
            
            if (product == null) throw new KeyNotFoundException($"Product {itemDto.ProductId} not found");

            if (product.ProductType == ECommerce.Core.Enums.ProductType.Combo)
            {
                // Handle Combo Product Stock Deduction
                if (product.BundleItems == null || !product.BundleItems.Any())
                    throw new InvalidOperationException($"Combo product {product.Name} has no components defined.");

                foreach (var bundleItem in product.BundleItems)
                {
                    int totalNeeded = bundleItem.Quantity * itemDto.Quantity;
                    
                    // Deduct from Component Product
                    if (bundleItem.ComponentProduct.StockQuantity < totalNeeded)
                        throw new InvalidOperationException($"Insufficient stock for component {bundleItem.ComponentProduct.Name} in combo {product.Name}");
                    
                    bundleItem.ComponentProduct.StockQuantity -= totalNeeded;
                    _unitOfWork.Repository<Product>().Update(bundleItem.ComponentProduct);

                    // Deduct from Component Variant if specified
                    if (bundleItem.ComponentVariantId.HasValue)
                    {
                        var variant = bundleItem.ComponentVariant;
                        if (variant == null)
                        {
                            // Try to fetch it if not loaded (though spec should load it)
                            variant = await _unitOfWork.Repository<ProductVariant>().GetByIdAsync(bundleItem.ComponentVariantId.Value);
                        }

                        if (variant != null)
                        {
                            if (variant.StockQuantity < totalNeeded)
                                throw new InvalidOperationException($"Insufficient variant stock for {bundleItem.ComponentProduct.Name} ({variant.Size}) in combo {product.Name}");
                            
                            variant.StockQuantity -= totalNeeded;
                            _unitOfWork.Repository<ProductVariant>().Update(variant);
                        }
                    }
                }

                // Optional: Update the Combo's own stock if used as a cache
                if (product.StockQuantity >= itemDto.Quantity)
                {
                    product.StockQuantity -= itemDto.Quantity;
                    _unitOfWork.Repository<Product>().Update(product);
                }
            }
            else
            {
                // Deduct from Simple Product Stock
                if (product.StockQuantity < itemDto.Quantity) throw new InvalidOperationException($"Insufficient stock for {product.Name}");
                product.StockQuantity -= itemDto.Quantity;
                _unitOfWork.Repository<Product>().Update(product);

                // Robust Variant Lookup
                ProductVariant variant = null;
                if (!string.IsNullOrEmpty(itemDto.Size))
                {
                    var normalizedSize = itemDto.Size.Trim().ToLower();
                    variant = product.Variants.FirstOrDefault(v => 
                        v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
                    
                    if (variant != null)
                    {
                        if (variant.StockQuantity < itemDto.Quantity) throw new InvalidOperationException($"Insufficient stock for {product.Name} ({itemDto.Size})");
                        variant.StockQuantity -= itemDto.Quantity;
                        _unitOfWork.Repository<ProductVariant>().Update(variant);
                    }
                }
            }

            // Price Fallback logic (Keep as is)
            decimal unitPrice = 0;
            // Lookup variant for price even for combo if combo has its own variants
            ProductVariant priceVariant = null;
            if (!string.IsNullOrEmpty(itemDto.Size))
            {
                 var normalizedSize = itemDto.Size.Trim().ToLower();
                 priceVariant = product.Variants.FirstOrDefault(v => 
                    v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
            }

            if (priceVariant != null && (priceVariant.Price ?? 0) > 0)
            {
                unitPrice = priceVariant.Price.Value;
            }
            else
            {
                unitPrice = product.Variants.Where(v => (v.Price ?? 0) > 0)
                                           .Select(v => v.Price.Value)
                                           .DefaultIfEmpty(0)
                                           .Min();
            }
            
            var orderItem = new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = unitPrice,
                Quantity = itemDto.Quantity,
                Color = itemDto.Color,
                Size = itemDto.Size,
                ImageUrl = product.ImageUrl
            };
            
            items.Add(orderItem);
        }

        var subtotal = items.Sum(i => i.TotalPrice);
        decimal shippingCost = 0;
        
        // Fetch Site Settings for Free Shipping Threshold
        var siteSettings = await _unitOfWork.Repository<SiteSetting>().ListAllAsync();
        var settings = siteSettings.FirstOrDefault();
        var freeShippingThreshold = settings?.FreeShippingThreshold ?? 0;

        // Lookup delivery method if provided
        if (orderDto.DeliveryMethodId.HasValue)
        {
            var method = await _unitOfWork.Repository<DeliveryMethod>().GetByIdAsync(orderDto.DeliveryMethodId.Value);
            if (method != null)
            {
                if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold)
                {
                    shippingCost = 0;
                }
                else
                {
                    shippingCost = method.Cost;
                }
            }
        }
        else
        {
             // If no delivery method is selected, we should strictly require it or default to 0/handling
             // ideally the frontend forces a selection.
             shippingCost = 0; 
        }

        var order = new Order
        {
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
            CustomerName = orderDto.Name,
            CustomerPhone = orderDto.Phone,
            ShippingAddress = orderDto.Address,
            Items = items,
            SubTotal = subtotal,
            Tax = 0,
            ShippingCost = shippingCost,
            DeliveryMethodId = orderDto.DeliveryMethodId,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        
        order.Total = order.SubTotal + order.Tax + order.ShippingCost;

        _unitOfWork.Repository<Order>().Add(order);
        
        await _unitOfWork.Complete();

        await _customerService.CreateOrUpdateCustomerAsync(
            orderDto.Phone,
            orderDto.Name,
            orderDto.Address
        );
        
        return _mapper.Map<Order, OrderDto>(order);
    }

    public async Task<IReadOnlyList<OrderDto>> GetOrdersAsync()
    {
        var spec = new BaseSpecification<Order>();
        spec.AddInclude(x => x.Items);
        var orders = await _unitOfWork.Repository<Order>().ListAsync(spec);
            
        return _mapper.Map<IReadOnlyList<Order>, IReadOnlyList<OrderDto>>(orders);
    }

    public async Task<OrderDto?> GetOrderByIdAsync(int id)
    {
        var spec = new BaseSpecification<Order>(x => x.Id == id);
        spec.AddInclude(x => x.Items);
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);

        return _mapper.Map<Order, OrderDto>(order);
    }

    public async Task<bool> UpdateOrderStatusAsync(int id, string status)
    {
        var spec = new BaseSpecification<Order>(x => x.Id == id);
        spec.AddInclude(x => x.Items);
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);
        
        if (order == null) return false;

        if (Enum.TryParse<OrderStatus>(status, true, out var newStatus))
        {
            // Restore stock if cancelling
            if (newStatus == OrderStatus.Cancelled && order.Status != OrderStatus.Cancelled)
            {
                foreach (var item in order.Items)
                {
                    var productSpec = new ProductsWithCategoriesSpecification(item.ProductId);
                    var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec(productSpec);
                    
                    if (product != null)
                    {
                        if (product.ProductType == ECommerce.Core.Enums.ProductType.Combo)
                        {
                            // Restore stock to components
                            foreach (var bundleItem in product.BundleItems)
                            {
                                int totalToRestore = bundleItem.Quantity * item.Quantity;
                                
                                bundleItem.ComponentProduct.StockQuantity += totalToRestore;
                                _unitOfWork.Repository<Product>().Update(bundleItem.ComponentProduct);

                                if (bundleItem.ComponentVariantId.HasValue)
                                {
                                    var variant = bundleItem.ComponentVariant;
                                    if (variant != null)
                                    {
                                        variant.StockQuantity += totalToRestore;
                                        _unitOfWork.Repository<ProductVariant>().Update(variant);
                                    }
                                }
                            }

                            // Restore Combo's own stock cache
                            product.StockQuantity += item.Quantity;
                            _unitOfWork.Repository<Product>().Update(product);
                        }
                        else
                        {
                            // Restore Simple Product Stock
                            product.StockQuantity += item.Quantity;
                            _unitOfWork.Repository<Product>().Update(product);

                            if (!string.IsNullOrEmpty(item.Size))
                            {
                                var normalizedSize = item.Size.Trim().ToLower();
                                var variant = product.Variants.FirstOrDefault(v => 
                                    v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
                                
                                if (variant != null)
                                {
                                    variant.StockQuantity += item.Quantity;
                                    _unitOfWork.Repository<ProductVariant>().Update(variant);
                                }
                            }
                        }
                    }
                }
            }


            order.Status = newStatus;
            _unitOfWork.Repository<Order>().Update(order);
            return await _unitOfWork.Complete() > 0;
        }

        return false;
    }

    public async Task<(IReadOnlyList<OrderDto> Items, int Total)> GetOrdersForAdminAsync(string? searchTerm, string? status, string? dateRange, int page, int pageSize)
    {
        var spec = new OrdersWithFiltersForAdminSpecification(searchTerm, status, dateRange);
        var total = await _unitOfWork.Repository<Order>().CountAsync(spec);
        
        spec.ApplyPaging(pageSize * (page - 1), pageSize);
        var orders = await _unitOfWork.Repository<Order>().ListAsync(spec);
        
        return (_mapper.Map<IReadOnlyList<Order>, IReadOnlyList<OrderDto>>(orders), total);
    }
}

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
        
        // 1. Bulk Fetch Products to fix N+1 query issue
        var productIds = orderDto.Items.Select(i => i.ProductId).Distinct().ToList();
        var productSpec = new ProductsWithCategoriesSpecification(productIds);
        
        // Pass track: true so EF Core tracks changes for stock deductions
        var products = await _unitOfWork.Repository<Product>().ListAsync(productSpec, track: true);
        var productDict = products.ToDictionary(p => p.Id);

        foreach (var itemDto in orderDto.Items)
        {
            if (!productDict.TryGetValue(itemDto.ProductId, out var product))
            {
                throw new KeyNotFoundException($"Product {itemDto.ProductId} not found");
            }

            // Calculate total units to deduct (Quantity * BundleMultiplier)
            int multiplier = product.IsBundle ? product.BundleQuantity : 1;
            int totalDeduction = itemDto.Quantity * multiplier;

            // 1. Deduct from specific variant if size/variant is selected
            if (!string.IsNullOrEmpty(itemDto.Size))
            {
                var normalizedSize = itemDto.Size.Trim().ToLower();
                var variant = product.Variants.FirstOrDefault(v => 
                    v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
                
                if (variant != null)
                {
                    if (variant.StockQuantity < totalDeduction)
                        throw new InvalidOperationException($"Insufficient stock for {product.Name} ({itemDto.Size}). Needed: {totalDeduction}, Available: {variant.StockQuantity}");
                    
                    variant.StockQuantity -= totalDeduction;
                    // Repository update isn't strictly necessary when tracking is enabled, 
                    // but keeping it for explicitness or in case GenericRepository requires it for its internal state.
                    _unitOfWork.Repository<ProductVariant>().Update(variant);
                }
            }

            // 2. Deduct from main product stock (as an aggregate or for simple products)
            if (product.StockQuantity < totalDeduction)
                throw new InvalidOperationException($"Insufficient stock for {product.Name}. Needed: {totalDeduction}, Available: {product.StockQuantity}");

            product.StockQuantity -= totalDeduction;
            _unitOfWork.Repository<Product>().Update(product);

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
                // Consistency fix: Ensure we pick the lower price if CompareAtPrice is used as a discount field
                var p = priceVariant.Price.Value;
                var cp = priceVariant.CompareAtPrice ?? 0;
                unitPrice = (cp > 0 && cp < p) ? cp : p;
            }
            else
            {
                // Fallback: Get the minimum positive active price from any variant
                var validVariants = product.Variants.Where(v => (v.Price ?? 0) > 0).ToList();
                if (validVariants.Any())
                {
                    unitPrice = validVariants.Min(v => {
                        var p = v.Price ?? 0;
                        var cp = v.CompareAtPrice ?? 0;
                        return (cp > 0 && cp < p) ? cp : p;
                    });
                }
            }
            
            // Image fallback: Try to get color-specific image if available
            var itemImageUrl = product.ImageUrl;
            if (!string.IsNullOrEmpty(itemDto.Color) && product.Images != null)
            {
                var colorImg = product.Images.FirstOrDefault(i => i.Color == itemDto.Color);
                if (colorImg != null) itemImageUrl = colorImg.Url;
            }

            var orderItem = new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = unitPrice,
                Quantity = itemDto.Quantity,
                Color = itemDto.Color,
                Size = itemDto.Size,
                ImageUrl = itemImageUrl
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
            City = orderDto.City,
            Area = orderDto.Area,
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
        Console.WriteLine("--- ABOUT TO MAP ORDER TO ORDERDTO ---");
        try {
            var result = _mapper.Map<Order, OrderDto>(order);
            Console.WriteLine("--- MAPPING SUCCESSFUL ---");
            return result;
        } catch (Exception ex) {
            Console.WriteLine($"--- MAPPING FAILED: {ex.Message} ---");
            throw;
        }
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
                // Bulk fetch all products at once to avoid N+1
                var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
                var products = await _unitOfWork.Repository<Product>().ListAsync(
                    new ProductsWithCategoriesSpecification(productIds), track: true);
                var productDict = products.ToDictionary(p => p.Id);

                foreach (var item in order.Items)
                {
                    if (productDict.TryGetValue(item.ProductId, out var product))
                    {
                        int multiplier = product.IsBundle ? product.BundleQuantity : 1;
                        // Restore Product Stock
                        product.StockQuantity += item.Quantity * multiplier;

                        if (!string.IsNullOrEmpty(item.Size))
                        {
                            var normalizedSize = item.Size.Trim().ToLower();
                            var variant = product.Variants.FirstOrDefault(v => 
                                v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
                            
                            if (variant != null)
                            {
                                variant.StockQuantity += item.Quantity * multiplier;
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

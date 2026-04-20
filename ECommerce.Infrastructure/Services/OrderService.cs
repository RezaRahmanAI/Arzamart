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
    // Removed SteadfastService

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

            // 1 & 2. Deduct from stock ONLY if NOT a pre-order
            if (!orderDto.IsPreOrder)
            {
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
                        _unitOfWork.Repository<ProductVariant>().Update(variant);
                    }
                }

                // 2. Deduct from main product stock
                if (product.StockQuantity < totalDeduction)
                    throw new InvalidOperationException($"Insufficient stock for {product.Name}. Needed: {totalDeduction}, Available: {product.StockQuantity}");

                product.StockQuantity -= totalDeduction;
                _unitOfWork.Repository<Product>().Update(product);
            }

            // Price Fallback logic (Keep as is)
            decimal unitPrice = 0;
            // Lookup variant for price even for combo if combo has its own variants
            ProductVariant? priceVariant = null;
            if (!string.IsNullOrEmpty(itemDto.Size))
            {
                 var normalizedSize = itemDto.Size.Trim().ToLower();
                 priceVariant = product.Variants.FirstOrDefault(v => 
                    v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
            }

            if (priceVariant != null && (priceVariant.Price ?? 0) > 0)
            {
                unitPrice = priceVariant.Price ?? 0;
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
            
            // Image fallback
            var itemImageUrl = product.ImageUrl;

            var orderItem = new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = unitPrice,
                Quantity = itemDto.Quantity,
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
            OrderNumber = "PENDING", // Will be set after first save if using ID, or generated simply
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
            Status = orderDto.IsPreOrder ? OrderStatus.PreOrder : OrderStatus.Pending,
            IsPreOrder = orderDto.IsPreOrder,
            SourcePageId = orderDto.SourcePageId,
            SocialMediaSourceId = orderDto.SocialMediaSourceId,
            CreatedAt = DateTime.UtcNow
        };
        
        order.Total = order.SubTotal + order.Tax + order.ShippingCost;

        _unitOfWork.Repository<Order>().Add(order);
        await _unitOfWork.Complete();

        // 5. Update OrderNumber to be a simple ID-based string
        order.OrderNumber = (270000 + order.Id).ToString(); 
        _unitOfWork.Repository<Order>().Update(order);
        await _unitOfWork.Complete();

        await _customerService.CreateOrUpdateCustomerAsync(
            orderDto.Phone,
            orderDto.Name,
            orderDto.Address
        );
        return _mapper.Map<Order, OrderDto>(order);
    }

    public async Task<OrderDto> UpdateOrderAsync(int id, OrderCreateDto orderDto)
    {
        var spec = new BaseSpecification<Order>(o => o.Id == id);
        spec.AddInclude(o => o.Items);
        spec.AddInclude(o => o.Notes);
        spec.AddInclude(o => o.Logs);
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);

        if (order == null) throw new KeyNotFoundException("Order not found");

        // 1. Handle Stock Reversal for existing items (if NOT pre-order)
        if (!order.IsPreOrder)
        {
            await AdjustStockOnStatusChangeAsync(order, returnToStock: true);
        }

        // 2. Clear existing items from DB (we will recreate them)
        foreach(var item in order.Items.ToList()) {
             _unitOfWork.Repository<OrderItem>().Delete(item);
        }

        // 3. Process New Items and Deduct Stock
        var newItems = new List<OrderItem>();
        var productIds = orderDto.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _unitOfWork.Repository<Product>().ListAsync(new ProductsWithCategoriesSpecification(productIds), track: true);
        var productDict = products.ToDictionary(p => p.Id);

        foreach (var itemDto in orderDto.Items)
        {
            if (!productDict.TryGetValue(itemDto.ProductId, out var product)) continue;

            if (!orderDto.IsPreOrder)
            {
                int multiplier = product.IsBundle ? product.BundleQuantity : 1;
                int deduction = itemDto.Quantity * multiplier;

                product.StockQuantity -= deduction;
                if (!string.IsNullOrEmpty(itemDto.Size))
                {
                    var variant = product.Variants.FirstOrDefault(v => v.Size?.Trim().ToLower() == itemDto.Size.Trim().ToLower());
                    if (variant != null) variant.StockQuantity -= deduction;
                }
            }

            newItems.Add(new OrderItem {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = itemDto.UnitPrice ?? 0,
                Quantity = itemDto.Quantity,
                Size = itemDto.Size,
                ImageUrl = itemDto.ImageUrl ?? product.ImageUrl
            });
        }

        // 4. Update Order Head
        order.CustomerName = orderDto.Name;
        order.CustomerPhone = orderDto.Phone;
        order.ShippingAddress = orderDto.Address;
        order.City = orderDto.City;
        order.Area = orderDto.Area;
        order.Items = newItems;
        order.IsPreOrder = orderDto.IsPreOrder;
        order.DeliveryMethodId = orderDto.DeliveryMethodId;
        order.SourcePageId = orderDto.SourcePageId;
        order.SocialMediaSourceId = orderDto.SocialMediaSourceId;
        
        order.SubTotal = newItems.Sum(i => i.UnitPrice * i.Quantity);
        
        // Recalculate Shipping
        if (order.DeliveryMethodId.HasValue) {
            var method = await _unitOfWork.Repository<DeliveryMethod>().GetByIdAsync(order.DeliveryMethodId.Value);
            order.ShippingCost = method?.Cost ?? 0;
        }

        order.Total = order.SubTotal + order.ShippingCost;

        _unitOfWork.Repository<Order>().Update(order);
        await _unitOfWork.Complete();

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
        spec.AddInclude(x => x.Logs);
        spec.AddInclude(x => x.Notes);
        spec.AddInclude(x => x.SourcePage!);
        spec.AddInclude(x => x.SocialMediaSource!);
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);

        return _mapper.Map<Order, OrderDto>(order!);
    }

    public async Task<bool> UpdateOrderStatusAsync(int id, string status, string? updatedBy = null, string? note = null)
    {
        var spec = new BaseSpecification<Order>(x => x.Id == id);
        spec.AddInclude(x => x.Items);
        spec.AddInclude(x => x.Logs);
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);
        
        if (order == null) return false;

        if (Enum.TryParse<OrderStatus>(status, true, out var newStatus))
        {
            var oldStatus = order.Status;
            
            // Return stock if moving TO Cancelled from something else
            if (newStatus == OrderStatus.Cancelled && oldStatus != OrderStatus.Cancelled)
            {
                await AdjustStockOnStatusChangeAsync(order, returnToStock: true);
            }
            // Deduct stock if moving FROM Cancelled to something else
            else if (oldStatus == OrderStatus.Cancelled && newStatus != OrderStatus.Cancelled)
            {
                 await AdjustStockOnStatusChangeAsync(order, returnToStock: false);
            }

            // Handle Pre-order conversion
            if (newStatus == OrderStatus.PreOrder && !order.IsPreOrder)
            {
                // Moving FROM Main Order TO Pre-Order: Return items to stock
                if (oldStatus != OrderStatus.Cancelled) // Already returned if it was cancelled
                {
                    await AdjustStockOnStatusChangeAsync(order, returnToStock: true);
                }
                order.IsPreOrder = true;
            }
            else if (order.IsPreOrder && newStatus != OrderStatus.PreOrder)
            {
                // Moving FROM Pre-Order TO Main Order: Restore flag and deduct stock
                order.IsPreOrder = false;
                
                // If moving to a standard active status (not Cancelled), deduct stock
                if (oldStatus == OrderStatus.PreOrder && newStatus != OrderStatus.Cancelled)
                {
                    await AdjustStockOnStatusChangeAsync(order, returnToStock: false);
                }
            }

            order.Status = newStatus;
            
            // Log the change
            var log = new OrderLog
            {
                OrderId = order.Id,
                StatusFrom = oldStatus.ToString(),
                StatusTo = newStatus.ToString(),
                ChangedBy = updatedBy ?? "System",
                Note = note,
                CreatedAt = DateTime.UtcNow
            };
            _unitOfWork.Repository<OrderLog>().Add(log);

            // Removed Steadfast consignment creation
            
            _unitOfWork.Repository<Order>().Update(order);
            return await _unitOfWork.Complete() > 0;
        }

        return false;
    }

    private async Task AdjustStockOnStatusChangeAsync(Order order, bool returnToStock)
    {
        if (order.IsPreOrder) return;

        var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _unitOfWork.Repository<Product>().ListAsync(
            new ProductsWithCategoriesSpecification(productIds), track: true);
        var productDict = products.ToDictionary(p => p.Id);

        foreach (var item in order.Items)
        {
            if (productDict.TryGetValue(item.ProductId, out var product))
            {
                int multiplier = product.IsBundle ? product.BundleQuantity : 1;
                int totalChange = item.Quantity * multiplier;

                if (returnToStock)
                {
                    product.StockQuantity += totalChange;
                }
                else
                {
                    product.StockQuantity -= totalChange;
                }

                if (!string.IsNullOrEmpty(item.Size))
                {
                    var normalizedSize = item.Size.Trim().ToLower();
                    var variant = product.Variants.FirstOrDefault(v => 
                        v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
                    
                    if (variant != null)
                    {
                        if (returnToStock)
                            variant.StockQuantity += totalChange;
                        else
                            variant.StockQuantity -= totalChange;
                        
                        _unitOfWork.Repository<ProductVariant>().Update(variant);
                    }
                }
                _unitOfWork.Repository<Product>().Update(product);
            }
        }
    }

    public async Task<(IReadOnlyList<OrderDto> Items, int Total)> GetOrdersForAdminAsync(string? searchTerm, string? status, string? dateRange, int page, int pageSize, bool preOrderOnly = false, DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null, int? socialMediaSourceId = null)
    {
        var spec = new OrdersWithFiltersForAdminSpecification(searchTerm, status, dateRange, preOrderOnly, startDate, endDate, sourcePageId, socialMediaSourceId);
        var total = await _unitOfWork.Repository<Order>().CountAsync(spec);
        
        spec.ApplyPaging(pageSize * (page - 1), pageSize);
        var orders = await _unitOfWork.Repository<Order>().ListAsync(spec);
        
        return (_mapper.Map<IReadOnlyList<Order>, IReadOnlyList<OrderDto>>(orders), total);
    }

    public async Task<OrderDto> AddOrderNoteAsync(int id, string adminName, string note)
    {
        var spec = new BaseSpecification<Order>(o => o.Id == id);
        spec.AddInclude(o => o.Notes);
        spec.AddInclude(o => o.Items);
        spec.AddInclude(o => o.Logs);
        
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);
        if (order == null) throw new KeyNotFoundException("Order not found");

        if (string.IsNullOrWhiteSpace(note))
            throw new ArgumentException("Note cannot be empty");

        var orderNote = new OrderNote
        {
            OrderId = id,
            AdminName = adminName,
            Content = note,
            CreatedAt = DateTime.UtcNow
        };

        order.Notes.Add(orderNote);
        _unitOfWork.Repository<Order>().Update(order);
        await _unitOfWork.Complete();

        return _mapper.Map<Order, OrderDto>(order);
    }
}

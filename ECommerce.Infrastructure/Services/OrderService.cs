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

        // 2. Pre-scan for stock availability to determine if this should be an auto Pre-Order
        bool autoPreOrder = false;
        if (!orderDto.IsPreOrder)
        {
            foreach (var itemDto in orderDto.Items)
            {
                if (productDict.TryGetValue(itemDto.ProductId, out var product))
                {
                    int needed = itemDto.Quantity;

                    if (product.StockQuantity < needed)
                    {
                        autoPreOrder = true;
                        break;
                    }

                    if (!string.IsNullOrEmpty(itemDto.Size))
                    {
                        var normalizedSize = itemDto.Size.Trim().ToLower();
                        var variant = product.Variants.FirstOrDefault(v => 
                            v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
                        
                        if (variant != null && variant.StockQuantity < needed)
                        {
                            autoPreOrder = true;
                            break;
                        }
                    }
                }
            }
        }

        bool finalIsPreOrder = orderDto.IsPreOrder || autoPreOrder;

        foreach (var itemDto in orderDto.Items)
        {
            if (!productDict.TryGetValue(itemDto.ProductId, out var product))
            {
                throw new KeyNotFoundException($"Product {itemDto.ProductId} not found");
            }

            int totalDeduction = itemDto.Quantity;

            // 1 & 2. Deduct from stock ONLY if NOT a pre-order AND status is a "Deducted" status
            // Note: Since CreateOrderAsync usually defaults to Pending or PreOrder, stock will NOT be deducted here by default.
            if (!finalIsPreOrder && ShouldDeductStock(finalIsPreOrder ? OrderStatus.PreOrder : OrderStatus.Pending))
            {
                // 1. Deduct from specific variant if size/variant is selected
                if (!string.IsNullOrEmpty(itemDto.Size))
                {
                    var normalizedSize = itemDto.Size.Trim().ToLower();
                    var variant = product.Variants.FirstOrDefault(v => 
                        v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
                    
                    if (variant != null)
                    {
                        // We already pre-scanned, so this shouldn't fail if logic is correct, 
                        // but keeping a safety check that won't throw because we auto-pre-ordered
                        if (variant.StockQuantity >= totalDeduction)
                        {
                            variant.StockQuantity -= totalDeduction;
                            _unitOfWork.Repository<ProductVariant>().Update(variant);
                        }
                    }
                }

                // 2. Deduct from main product stock
                if (product.StockQuantity >= totalDeduction)
                {
                    product.StockQuantity -= totalDeduction;
                    _unitOfWork.Repository<Product>().Update(product);
                }
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
            Status = finalIsPreOrder ? OrderStatus.PreOrder : OrderStatus.Pending,
            IsPreOrder = finalIsPreOrder,
            SourcePageId = orderDto.SourcePageId,
            SocialMediaSourceId = orderDto.SocialMediaSourceId,
            AdminNote = orderDto.AdminNote,
            CustomerNote = orderDto.CustomerNote,
            Discount = orderDto.Discount,
            AdvancePayment = orderDto.AdvancePayment,
            CreatedAt = DateTime.UtcNow
        };
        
        order.Total = order.SubTotal + order.Tax + order.ShippingCost - order.Discount;

        _unitOfWork.Repository<Order>().Add(order);
        await _unitOfWork.Complete();

        // 5. Update OrderNumber to be a 4-digit string (e.g., 0001, 0002)
        order.OrderNumber = order.Id.ToString("D4"); 
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

        // 1. Handle Stock Reversal for existing items (if stock was already deducted)
        if (!order.IsPreOrder && ShouldDeductStock(order.Status))
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

            if (!orderDto.IsPreOrder && ShouldDeductStock(order.Status))
            {
                int deduction = itemDto.Quantity;

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
        order.AdminNote = orderDto.AdminNote;
        order.CustomerNote = orderDto.CustomerNote;
        order.Discount = orderDto.Discount;
        order.AdvancePayment = orderDto.AdvancePayment;
        
        order.SubTotal = newItems.Sum(i => i.UnitPrice * i.Quantity);
        
        // Recalculate Shipping
        decimal shippingCost = 0;
        var siteSettings = await _unitOfWork.Repository<SiteSetting>().ListAllAsync();
        var settings = siteSettings.FirstOrDefault();
        var freeShippingThreshold = settings?.FreeShippingThreshold ?? 0;

        if (order.DeliveryMethodId.HasValue)
        {
            var method = await _unitOfWork.Repository<DeliveryMethod>().GetByIdAsync(order.DeliveryMethodId.Value);
            if (method != null)
            {
                shippingCost = (freeShippingThreshold > 0 && order.SubTotal >= freeShippingThreshold) ? 0 : method.Cost;
            }
        }
        order.ShippingCost = shippingCost;
        order.Total = order.SubTotal + order.Tax + order.ShippingCost - order.Discount;
        await _unitOfWork.Complete();

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

        if (order == null) return null;

        var dto = _mapper.Map<Order, OrderDto>(order);
        if (order.IsPreOrder)
        {
            await PopulateItemsStockStatusAsync(order, dto);
        }
        
        return dto;
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
            
            bool wasDeducted = ShouldDeductStock(oldStatus) && !order.IsPreOrder;
            bool shouldBeDeducted = ShouldDeductStock(newStatus) && !order.IsPreOrder;

            if (wasDeducted && !shouldBeDeducted)
            {
                await AdjustStockOnStatusChangeAsync(order, returnToStock: true);
            }
            else if (!wasDeducted && shouldBeDeducted)
            {
                await AdjustStockOnStatusChangeAsync(order, returnToStock: false);
            }

            // Sync IsPreOrder flag ONLY when moving TO PreOrder status.
            // Do NOT automatically clear it when moving away from PreOrder status (requires explicit transfer).
            if (newStatus == OrderStatus.PreOrder)
            {
                order.IsPreOrder = true;
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

    private bool ShouldDeductStock(OrderStatus status)
    {
        return status switch
        {
            OrderStatus.Confirmed => true,
            OrderStatus.Processing => true,
            OrderStatus.Packed => true,
            OrderStatus.Shipped => true,
            OrderStatus.Delivered => true,
            _ => false
        };
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
                int totalChange = item.Quantity;

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

    public async Task<(IReadOnlyList<OrderDto> Items, int Total)> GetOrdersForAdminAsync(string? searchTerm, string? status, string? dateRange, int page, int pageSize, bool preOrderOnly = false, bool websiteOnly = false, bool manualOnly = false, DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null, int? socialMediaSourceId = null, string? customerPhone = null, int? productId = null, string? orderNumber = null)
    {
        var spec = new OrdersWithFiltersForAdminSpecification(searchTerm, status, dateRange, preOrderOnly, websiteOnly, manualOnly, startDate, endDate, sourcePageId, socialMediaSourceId, customerPhone, productId, orderNumber);
        var total = await _unitOfWork.Repository<Order>().CountAsync(spec);
        
        spec.ApplyPaging(pageSize * (page - 1), pageSize);
        var orders = await _unitOfWork.Repository<Order>().ListAsync(spec);
        
        var dtos = _mapper.Map<IReadOnlyList<Order>, IReadOnlyList<OrderDto>>(orders);

        // For pre-orders, calculate stock availability
        foreach (var dto in dtos.Where(d => d.IsPreOrder))
        {
            var order = orders.First(o => o.Id == dto.Id);
            await PopulateItemsStockStatusAsync(order, dto);
        }
        
        return (dtos, total);
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

    public async Task<OrderStatsDto> GetOrderStatsAsync(string? searchTerm, string? status, string? dateRange, bool preOrderOnly = false, bool websiteOnly = false, bool manualOnly = false, DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null, int? socialMediaSourceId = null, string? customerPhone = null, int? productId = null, string? orderNumber = null)
    {
        var spec = new OrdersWithFiltersForAdminSpecification(searchTerm, status, dateRange, preOrderOnly, websiteOnly, manualOnly, startDate, endDate, sourcePageId, socialMediaSourceId, customerPhone, productId, orderNumber);
        
        var query = _unitOfWork.Repository<Order>().GetQueryWithSpec(spec);

        var stats = await query.GroupBy(_ => 1)
            .Select(g => new OrderStatsDto
            {
                TotalOrders = g.Count(),
                Processing = g.Count(o => o.Status == OrderStatus.Processing || o.Status == OrderStatus.Pending),
                TotalRevenue = g.Sum(o => o.Total),
                RefundRequests = g.Count(o => o.Status == OrderStatus.Refund)
            })
            .FirstOrDefaultAsync();

        return stats ?? new OrderStatsDto();
    }

    public async Task<bool> TransferToMainOrderAsync(int id, string? adminName)
    {
        var spec = new BaseSpecification<Order>(o => o.Id == id);
        spec.AddInclude(o => o.Items);
        spec.AddInclude(o => o.Logs);
        
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);
        if (order == null || !order.IsPreOrder) return false;

        // 1. Clear PreOrder flag
        order.IsPreOrder = false;

        // 2. If status is already "Confirmed" or other active states, deduct stock now
        if (ShouldDeductStock(order.Status))
        {
            await AdjustStockOnStatusChangeAsync(order, returnToStock: false);
        }

        // 3. Log the transfer
        var log = new OrderLog
        {
            OrderId = order.Id,
            StatusFrom = "PreOrder Pool",
            StatusTo = "Main Order Pool",
            ChangedBy = adminName ?? "System",
            Note = "Transferred from Pre-Order to Main Order",
            CreatedAt = DateTime.UtcNow
        };
        _unitOfWork.Repository<OrderLog>().Add(log);

        _unitOfWork.Repository<Order>().Update(order);
        return await _unitOfWork.Complete() > 0;
    }

    private async Task PopulateItemsStockStatusAsync(Order order, OrderDto dto)
    {
        if (!order.Items.Any()) return;

        var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _unitOfWork.Repository<Product>().ListAsync(
            new ProductsWithCategoriesSpecification(productIds));
        var productDict = products.ToDictionary(p => p.Id);

        foreach (var itemDto in dto.Items)
        {
            if (productDict.TryGetValue(itemDto.ProductId, out var product))
            {
                int needed = itemDto.Quantity;
                if (!string.IsNullOrEmpty(itemDto.Size))
                {
                    var normalizedSize = itemDto.Size.Trim().ToLower();
                    var variant = product.Variants.FirstOrDefault(v => 
                        v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
                    itemDto.IsStockAvailable = variant != null && variant.StockQuantity >= needed;
                }
                else
                {
                    itemDto.IsStockAvailable = product.StockQuantity >= needed;
                }
            }
        }
        
        dto.IsStockAvailable = dto.Items.All(i => i.IsStockAvailable);
    }

    private async Task<bool> CalculateIsStockAvailableAsync(Order order)
    {
        if (!order.Items.Any()) return false;

        var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _unitOfWork.Repository<Product>().ListAsync(
            new ProductsWithCategoriesSpecification(productIds));
        var productDict = products.ToDictionary(p => p.Id);

        foreach (var item in order.Items)
        {
            if (!productDict.TryGetValue(item.ProductId, out var product)) return false;

            int needed = item.Quantity;

            if (!string.IsNullOrEmpty(item.Size))
            {
                var normalizedSize = item.Size.Trim().ToLower();
                var variant = product.Variants.FirstOrDefault(v => 
                    v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
                
                if (variant == null || variant.StockQuantity < needed) return false;
            }
            else
            {
                if (product.StockQuantity < needed) return false;
            }
        }

        return true;
    }
}

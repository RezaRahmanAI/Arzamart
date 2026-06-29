using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.Constants;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Specifications;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.Enums;

namespace ECommerce.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ICustomerService _customerService;
    private readonly IOrderNumberGenerator _orderNumberGenerator;
    private readonly IOrderStockService _stockService;
    private readonly IOrderStatusService _statusService;

    public OrderService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICustomerService customerService,
        IOrderNumberGenerator orderNumberGenerator,
        IOrderStockService stockService,
        IOrderStatusService statusService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _customerService = customerService;
        _orderNumberGenerator = orderNumberGenerator;
        _stockService = stockService;
        _statusService = statusService;
    }

    public async Task<OrderDto> CreateOrderAsync(OrderCreateDto orderDto)
    {
        // Business logic: normalize DeliveryMethodId
        if (orderDto.DeliveryMethodId == 0)
        {
            orderDto.DeliveryMethodId = null;
        }

        // Business logic: check for suspicious customer
        var customer = await _customerService.GetCustomerByPhoneAsync(orderDto.Phone);
        if (customer != null && customer.IsSuspicious)
        {
            throw new InvalidOperationException("Your account has been suspended. Please contact support.");
        }

        var items = new List<OrderItem>();
        
        // 1. Bulk Fetch Products to fix N+1 query issue
        var productIds = orderDto.Items.Select(i => i.ProductId).Distinct().ToList();
        var productSpec = new ProductsForStockSpecification(productIds);
        
        // Pass track: true so EF Core tracks changes for stock deductions
        var products = await _unitOfWork.Repository<Product>().ListAsync(productSpec, track: true);
        var productDict = products.ToDictionary(p => p.Id);

        // Wrap stock operations in a DB transaction for atomicity
        Order order = null!;
        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            // Pre-scan for stock availability to determine if this should be an auto Pre-Order
            bool autoPreOrder = false;
            if (!orderDto.IsPreOrder)
            {
                foreach (var itemDto in orderDto.Items)
                {
                    if (productDict.TryGetValue(itemDto.ProductId, out var product))
                    {
                        if (!await _stockService.CheckIsProductStockAvailableAsync(product, itemDto.Quantity, itemDto.Size))
                        {
                            autoPreOrder = true;
                            break;
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


                // 1 & 2. Deduct from stock ONLY if NOT a pre-order AND status is a "Deducted" status
                // Note: Since CreateOrderAsync usually defaults to Pending or PreOrder, stock will NOT be deducted here by default.
                if (!finalIsPreOrder && _stockService.ShouldDeductStock(finalIsPreOrder ? OrderStatus.PreOrder : OrderStatus.Pending))
                {
                    await _stockService.ProcessProductStockAdjustmentAsync(product, itemDto.Quantity, itemDto.Size, returnToStock: false);
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
                    Quantity = itemDto.Quantity,
                    UnitPrice = unitPrice,
                    Size = itemDto.Size,
                    ImageUrl = itemImageUrl
                };
                
                items.Add(orderItem);
            }

            var subtotal = items.Sum(i => i.UnitPrice * i.Quantity);
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

            order = new Order
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
            
            // Server-side total calculation — never trust client-supplied Total
            order.Total = order.SubTotal + order.Tax + order.ShippingCost - order.Discount;

            // Validate Discount doesn't exceed subtotal + tax + shipping
            if (order.Discount < 0)
                order.Discount = 0;
            if (order.Discount > order.SubTotal + order.Tax + order.ShippingCost)
                order.Discount = order.SubTotal + order.Tax + order.ShippingCost;

            // Recalculate after clamping
            order.Total = order.SubTotal + order.Tax + order.ShippingCost - order.Discount;

            // Validate AdvancePayment doesn't exceed total
            if (order.AdvancePayment < 0)
                order.AdvancePayment = 0;
            if (order.AdvancePayment > order.Total)
                order.AdvancePayment = order.Total;

            _unitOfWork.Repository<Order>().Add(order);
            await _unitOfWork.Complete();

            // 5. Update OrderNumber using generator and persist it
            order.OrderNumber = _orderNumberGenerator.Generate(order.Id);
            await _unitOfWork.Complete();
        });

        await _customerService.CreateOrUpdateCustomerAsync(
            orderDto.Phone,
            orderDto.Name,
            orderDto.Address,
            orderDto.City,
            orderDto.Area
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

        // Wrap entire update in a transaction to prevent stock inconsistency
        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            // 1. Handle Stock Reversal for existing items (if stock was already deducted)
            if (!order.IsPreOrder && _stockService.ShouldDeductStock(order.Status))
            {
                await _stockService.AdjustStockOnStatusChangeAsync(order, returnToStock: true);
            }

            // 2. Clear existing items from DB (we will recreate them)
            order.Items.Clear();

            // 3. Process New Items and Deduct Stock
            var newItems = new List<OrderItem>();
            var productIds = orderDto.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _unitOfWork.Repository<Product>().ListAsync(new ProductsForStockSpecification(productIds), track: true);
            var productDict = products.ToDictionary(p => p.Id);

            foreach (var itemDto in orderDto.Items)
            {
                if (!productDict.TryGetValue(itemDto.ProductId, out var product)) continue;

                if (!orderDto.IsPreOrder && _stockService.ShouldDeductStock(order.Status))
                {
                    await _stockService.ProcessProductStockAdjustmentAsync(product, itemDto.Quantity, itemDto.Size, returnToStock: false);
                }

                newItems.Add(new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice ?? 0,
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
            order.Items.Clear();
            foreach (var ni in newItems) order.Items.Add(ni);
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
        });

        await _customerService.CreateOrUpdateCustomerAsync(
            orderDto.Phone,
            orderDto.Name,
            orderDto.Address,
            orderDto.City,
            orderDto.Area
        );

        return _mapper.Map<Order, OrderDto>(order);
    }

    public async Task<PaginationDto<OrderDto>> GetOrdersAsync(string? userId = null, int page = 1, int pageSize = 10)
    {
        var spec = new BaseSpecification<Order>();
        if (!string.IsNullOrEmpty(userId))
        {
            // Look up customer by userId to get their phone, then filter orders
            var customer = await _unitOfWork.Repository<Customer>().GetQueryable()
                .FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer != null)
            {
                spec = new BaseSpecification<Order>(o => o.CustomerPhone == customer.Phone);
            }
            else
            {
                // No customer found for this user, return empty
                return new PaginationDto<OrderDto>(page, pageSize, 0, new List<OrderDto>());
            }
        }
        spec.AddInclude(x => x.Items);
        spec.ApplyPaging((page - 1) * pageSize, pageSize);
        var total = await _unitOfWork.Repository<Order>().CountAsync(spec);
        var orders = await _unitOfWork.Repository<Order>().ListAsync(spec);

        var dtos = _mapper.Map<IReadOnlyList<Order>, IReadOnlyList<OrderDto>>(orders);
        return new PaginationDto<OrderDto>(page, pageSize, total, dtos);
    }

    public async Task<IReadOnlyList<OrderDto>> GetOrdersByPhoneAsync(string phone)
    {
        var spec = new BaseSpecification<Order>(x => x.CustomerPhone == phone);
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
            await _stockService.PopulateItemsStockStatusAsync(order, dto);
        }
        
        return dto;
    }

    public Task<bool> UpdateOrderStatusAsync(int id, string status, string? updatedBy = null, string? note = null)
    {
        return _statusService.UpdateOrderStatusAsync(id, status, updatedBy, note);
    }

    public async Task<(IReadOnlyList<OrderDto> Items, int Total)> GetOrdersForAdminAsync(string? searchTerm, string? status, string? dateRange, int page, int pageSize, bool preOrderOnly = false, bool websiteOnly = false, bool manualOnly = false, DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null, int? socialMediaSourceId = null, string? customerPhone = null, int? productId = null, string? orderNumber = null)
    {
        var spec = new OrdersWithFiltersForAdminSpecification(searchTerm, status, dateRange, preOrderOnly, websiteOnly, manualOnly, startDate, endDate, sourcePageId, socialMediaSourceId, customerPhone, productId, orderNumber);
        var total = await _unitOfWork.Repository<Order>().CountAsync(spec);
        
        spec.ApplyPaging(pageSize * (page - 1), pageSize);
        var orders = await _unitOfWork.Repository<Order>().ListAsync(spec);
        
        var dtos = _mapper.Map<IReadOnlyList<Order>, IReadOnlyList<OrderDto>>(orders);
        
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
        if (_stockService.ShouldDeductStock(order.Status))
        {
            await _stockService.AdjustStockOnStatusChangeAsync(order, returnToStock: false);
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

    public async Task ClearCartAsync(string? userId, string? sessionId)
    {
        Cart? cart = null;
        if (!string.IsNullOrEmpty(userId))
        {
            cart = await _unitOfWork.Repository<Cart>().GetQueryable()
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }
        else if (!string.IsNullOrEmpty(sessionId))
        {
            cart = await _unitOfWork.Repository<Cart>().GetQueryable()
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.SessionId == sessionId && c.UserId == null);
        }

        if (cart != null && cart.Items.Any())
        {
            foreach (var item in cart.Items.ToList())
            {
                _unitOfWork.Repository<CartItem>().Delete(item);
            }
            await _unitOfWork.Complete();
        }
    }
}

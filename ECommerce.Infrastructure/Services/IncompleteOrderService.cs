using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Enums;
using Microsoft.EntityFrameworkCore;
using ECommerce.Infrastructure.Specifications;

namespace ECommerce.Infrastructure.Services;

public class IncompleteOrderService : IIncompleteOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IOrderService _orderService;

    public IncompleteOrderService(IUnitOfWork unitOfWork, IMapper mapper, IOrderService orderService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _orderService = orderService;
    }

    public async Task<OrderDto> AutosaveIncompleteOrderAsync(IncompleteOrderAutosaveDto dto, string? ipAddress, string? userAgent)
    {
        if (string.IsNullOrEmpty(dto.SessionId))
        {
            throw new ArgumentException("SessionId is required for autosave");
        }

        // 1. Check if there is an existing incomplete order for this SessionId
        var order = await _unitOfWork.Repository<Order>().GetQueryable()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.SessionId == dto.SessionId && 
                                     (o.Status == OrderStatus.Incomplete || o.Status == OrderStatus.IncompleteContacted));

        // 2. If not found, and phone is provided, check if there is an existing incomplete order with the same phone
        if (order == null && !string.IsNullOrEmpty(dto.CustomerPhone))
        {
            order = await _unitOfWork.Repository<Order>().GetQueryable()
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.CustomerPhone == dto.CustomerPhone && 
                                         (o.Status == OrderStatus.Incomplete || o.Status == OrderStatus.IncompleteContacted));
        }

        bool isNew = false;
        if (order == null)
        {
            isNew = true;
            order = new Order
            {
                SessionId = dto.SessionId,
                Status = OrderStatus.Incomplete,
                CreatedAt = DateTime.UtcNow,
                OrderNumber = "INCOMPLETE"
            };
        }

        // 3. Update fields (preserving existing ones if new values are null/empty)
        if (!string.IsNullOrEmpty(dto.CustomerName)) order.CustomerName = dto.CustomerName;
        if (!string.IsNullOrEmpty(dto.CustomerPhone)) order.CustomerPhone = dto.CustomerPhone;
        if (!string.IsNullOrEmpty(dto.ShippingAddress)) order.ShippingAddress = dto.ShippingAddress;
        if (!string.IsNullOrEmpty(dto.City)) order.City = dto.City;
        if (!string.IsNullOrEmpty(dto.Area)) order.Area = dto.Area;
        
        if (dto.LandingPageId.HasValue)
        {
            var sourcePage = await _unitOfWork.Repository<SourcePage>().GetByIdAsync(dto.LandingPageId.Value);
            order.SourcePageId = sourcePage != null ? dto.LandingPageId : null;
        }
        if (!string.IsNullOrEmpty(dto.ReferrerUrl)) order.ReferrerUrl = dto.ReferrerUrl;
        if (!string.IsNullOrEmpty(dto.UtmSource)) order.UtmSource = dto.UtmSource;
        if (!string.IsNullOrEmpty(dto.UtmCampaign)) order.UtmCampaign = dto.UtmCampaign;
        if (!string.IsNullOrEmpty(dto.UtmAdset)) order.UtmAdset = dto.UtmAdset;
        if (!string.IsNullOrEmpty(dto.UtmAd)) order.UtmAd = dto.UtmAd;
        if (!string.IsNullOrEmpty(dto.Fbclid)) order.Fbclid = dto.Fbclid;
        if (!string.IsNullOrEmpty(dto.DeviceType)) order.DeviceType = dto.DeviceType;
        if (!string.IsNullOrEmpty(dto.Browser)) order.Browser = dto.Browser;
        if (!string.IsNullOrEmpty(ipAddress)) order.CreatedIp = ipAddress;

        order.UpdatedAt = DateTime.UtcNow;

        // 4. Update items if product details are provided
        if (dto.ProductId.HasValue)
        {
            // Clear existing items (since incomplete order typically holds the active selected product on LP/checkout)
            order.Items.Clear();
            order.Items.Add(new OrderItem
            {
                ProductId = dto.ProductId.Value,
                ProductName = dto.ProductName ?? "Product",
                Quantity = dto.Quantity,
                UnitPrice = dto.Quantity > 0 ? (dto.TotalPrice / dto.Quantity) : dto.TotalPrice,
                Size = dto.SelectedSize
            });

            order.SubTotal = dto.TotalPrice;
            order.Total = dto.TotalPrice;
        }

        if (isNew)
        {
            _unitOfWork.Repository<Order>().Add(order);
        }
        else
        {
            _unitOfWork.Repository<Order>().Update(order);
        }

        await _unitOfWork.Complete();

        // If newly created and ID is generated, set dummy OrderNumber for display consistency
        if (order.OrderNumber == "INCOMPLETE")
        {
            order.OrderNumber = $"INC-{order.Id}";
            _unitOfWork.Repository<Order>().Update(order);
            await _unitOfWork.Complete();
        }

        return _mapper.Map<Order, OrderDto>(order);
    }

    public async Task<(IReadOnlyList<OrderDto> Items, int Total)> GetIncompleteOrdersForAdminAsync(
        string? searchTerm, string? status, string? dateRange, int page, int pageSize, 
        DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null)
    {
        var query = _unitOfWork.Repository<Order>().GetQueryable()
            .Include(o => o.Items)
            .Include(o => o.SourcePage)
            .Where(o => o.Status == OrderStatus.Incomplete || 
                        o.Status == OrderStatus.IncompleteContacted || 
                        o.Status == OrderStatus.IncompleteLost);

        // Filter by specific status if requested
        if (!string.IsNullOrEmpty(status) && status != "All")
        {
            if (Enum.TryParse<OrderStatus>(status, true, out var statusEnum))
            {
                query = query.Where(o => o.Status == statusEnum);
            }
        }

        // Filter by search term (Name, Phone, Product Name, OrderNumber)
        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(o => o.CustomerName.Contains(searchTerm) || 
                                     o.CustomerPhone.Contains(searchTerm) || 
                                     o.OrderNumber.Contains(searchTerm) ||
                                     o.Items.Any(i => i.ProductName.Contains(searchTerm)));
        }

        // Filter by source landing page
        if (sourcePageId.HasValue)
        {
            query = query.Where(o => o.SourcePageId == sourcePageId.Value);
        }

        // Apply Date Range
        query = ApplyDateRangeFilter(query, dateRange, startDate, endDate);

        var total = await query.CountAsync();

        var orders = await query
            .OrderByDescending(o => o.UpdatedAt ?? o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = _mapper.Map<IReadOnlyList<Order>, IReadOnlyList<OrderDto>>(orders);
        return (dtos, total);
    }

    public async Task<IncompleteOrderStatsDto> GetIncompleteOrderStatsAsync(
        string? searchTerm, string? status, string? dateRange, 
        DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Dhaka");
        var utcNow = DateTime.UtcNow;
        var bdNow = TimeZoneInfo.ConvertTimeFromUtc(utcNow, tz);
        var bdTodayMidnight = bdNow.Date;
        var todayStartUtc = TimeZoneInfo.ConvertTimeToUtc(bdTodayMidnight, tz);

        // 1. Today's Incomplete count (created today, regardless of filters)
        var todayIncompleteCount = await _unitOfWork.Repository<Order>().GetQueryable()
            .CountAsync(o => (o.Status == OrderStatus.Incomplete || 
                              o.Status == OrderStatus.IncompleteContacted || 
                              o.Status == OrderStatus.IncompleteLost) && 
                             o.CreatedAt >= todayStartUtc);

        // 2. Base Query for overall recovery stats
        var statsQuery = _unitOfWork.Repository<Order>().GetQueryable()
            .Where(o => o.SessionId != null);

        if (sourcePageId.HasValue)
        {
            statsQuery = statsQuery.Where(o => o.SourcePageId == sourcePageId.Value);
        }

        statsQuery = ApplyDateRangeFilter(statsQuery, dateRange, startDate, endDate);

        var allLeads = await statsQuery.Select(o => new { o.Status, o.SourcePageId, SourcePageName = o.SourcePage != null ? o.SourcePage.Name : null }).ToListAsync();

        var incompleteCount = allLeads.Count(o => o.Status == OrderStatus.Incomplete || 
                                                  o.Status == OrderStatus.IncompleteContacted || 
                                                  o.Status == OrderStatus.IncompleteLost);
        var recoveredCount = allLeads.Count(o => o.Status != OrderStatus.Incomplete && 
                                                 o.Status != OrderStatus.Incomplete && 
                                                 o.Status != OrderStatus.IncompleteContacted && 
                                                 o.Status != OrderStatus.IncompleteLost);
        var totalLeads = allLeads.Count;

        decimal recoveryRate = totalLeads > 0 ? Math.Round(((decimal)recoveredCount / totalLeads) * 100, 2) : 0;

        // 3. Top Abandoned Landing Page
        var topLp = allLeads
            .Where(o => (o.Status == OrderStatus.Incomplete || 
                         o.Status == OrderStatus.IncompleteContacted || 
                         o.Status == OrderStatus.IncompleteLost) && 
                        o.SourcePageId != null && !string.IsNullOrEmpty(o.SourcePageName))
            .GroupBy(o => o.SourcePageName)
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .FirstOrDefault();

        return new IncompleteOrderStatsDto
        {
            TodayIncompleteCount = todayIncompleteCount,
            RecoveredCount = recoveredCount,
            RecoveryRate = recoveryRate,
            TopLandingPage = topLp?.Name ?? "N/A"
        };
    }

    public async Task<bool> UpdateIncompleteOrderStatusAsync(int id, OrderStatus status, string? updatedBy, string? note)
    {
        var spec = new BaseSpecification<Order>(o => o.Id == id);
        spec.AddInclude(o => o.Logs);
        spec.AddInclude(o => o.Notes);

        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);
        if (order == null) return false;

        var oldStatus = order.Status.ToString();
        order.Status = status;
        order.UpdatedAt = DateTime.UtcNow;

        // Add Log
        var log = new OrderLog
        {
            OrderId = order.Id,
            StatusFrom = oldStatus,
            StatusTo = status.ToString(),
            ChangedBy = updatedBy ?? "System",
            Note = note ?? $"Status updated manually to {status}",
            CreatedAt = DateTime.UtcNow
        };
        order.Logs.Add(log);

        // Add Note if provided
        if (!string.IsNullOrEmpty(note))
        {
            var orderNote = new OrderNote
            {
                OrderId = order.Id,
                AdminName = updatedBy ?? "System",
                Content = note,
                CreatedAt = DateTime.UtcNow
            };
            order.Notes.Add(orderNote);
        }

        _unitOfWork.Repository<Order>().Update(order);
        return await _unitOfWork.Complete() > 0;
    }

    public async Task<OrderDto> ConvertIncompleteToRealOrderAsync(int id, string? adminName)
    {
        var spec = new BaseSpecification<Order>(o => o.Id == id);
        spec.AddInclude(o => o.Items);
        spec.AddInclude(o => o.Logs);

        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);
        if (order == null) throw new KeyNotFoundException("Incomplete order not found");
        if (order.Status != OrderStatus.Incomplete && order.Status != OrderStatus.IncompleteContacted)
        {
            throw new InvalidOperationException("Only pending or contacted incomplete orders can be converted.");
        }

        if (!order.Items.Any())
        {
            throw new InvalidOperationException("Cannot convert order without items");
        }

        // Construct OrderCreateDto
        var orderCreateDto = new OrderCreateDto
        {
            Name = order.CustomerName,
            Phone = order.CustomerPhone,
            Address = order.ShippingAddress ?? "Converted Order",
            City = order.City ?? "",
            Area = order.Area ?? "",
            SourcePageId = order.SourcePageId,
            IsPreOrder = false,
            AdminNote = $"Converted from Incomplete Order #{order.Id}. {order.AdminNote}",
            Items = order.Items.Select(i => new OrderItemDto
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                Size = i.Size,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.UnitPrice * i.Quantity
            }).ToList()
        };

        // Call standard OrderService to create a fresh completed order
        var createdOrder = await _orderService.CreateOrderAsync(orderCreateDto);

        // Mark the incomplete order as Recovered (or simple update/delete, but updating is better for logs)
        order.Status = OrderStatus.Confirmed; // Marking it confirmed since it is placed
        order.UpdatedAt = DateTime.UtcNow;
        
        var log = new OrderLog
        {
            OrderId = order.Id,
            StatusFrom = "Incomplete",
            StatusTo = "Confirmed",
            ChangedBy = adminName ?? "System",
            Note = $"Converted to main Order #{createdOrder.OrderNumber}",
            CreatedAt = DateTime.UtcNow
        };
        order.Logs.Add(log);
        
        _unitOfWork.Repository<Order>().Update(order);
        await _unitOfWork.Complete();

        return createdOrder;
    }

    private IQueryable<Order> ApplyDateRangeFilter(IQueryable<Order> query, string? dateRange, DateTime? startDate, DateTime? endDate)
    {
        if (startDate.HasValue || endDate.HasValue)
        {
            if (startDate.HasValue)
                query = query.Where(o => o.CreatedAt >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(o => o.CreatedAt <= endDate.Value);
            return query;
        }

        if (string.IsNullOrEmpty(dateRange) || dateRange == "All Time")
        {
            return query;
        }

        var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Dhaka");
        var utcNow = DateTime.UtcNow;
        var bdNow = TimeZoneInfo.ConvertTimeFromUtc(utcNow, tz);
        var bdTodayMidnight = bdNow.Date;

        var todayStartUtc = TimeZoneInfo.ConvertTimeToUtc(bdTodayMidnight, tz);
        var todayEndUtc = TimeZoneInfo.ConvertTimeToUtc(bdTodayMidnight.AddDays(1), tz);
        var yesterdayStartUtc = TimeZoneInfo.ConvertTimeToUtc(bdTodayMidnight.AddDays(-1), tz);
        var last7StartUtc = TimeZoneInfo.ConvertTimeToUtc(bdTodayMidnight.AddDays(-7), tz);
        var last30StartUtc = TimeZoneInfo.ConvertTimeToUtc(bdTodayMidnight.AddDays(-30), tz);
        var thisYearStartUtc = TimeZoneInfo.ConvertTimeToUtc(new DateTime(bdNow.Year, 1, 1), tz);
        var nextYearStartUtc = TimeZoneInfo.ConvertTimeToUtc(new DateTime(bdNow.Year + 1, 1, 1), tz);

        return dateRange switch
        {
            "Today" => query.Where(o => o.CreatedAt >= todayStartUtc && o.CreatedAt < todayEndUtc),
            "Yesterday" => query.Where(o => o.CreatedAt >= yesterdayStartUtc && o.CreatedAt < todayStartUtc),
            "Last 7 Days" => query.Where(o => o.CreatedAt >= last7StartUtc && o.CreatedAt < todayEndUtc),
            "Last 30 Days" => query.Where(o => o.CreatedAt >= last30StartUtc && o.CreatedAt < todayEndUtc),
            "This Year" => query.Where(o => o.CreatedAt >= thisYearStartUtc && o.CreatedAt < nextYearStartUtc),
            _ => query
        };
    }
}

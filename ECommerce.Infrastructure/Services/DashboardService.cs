using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Domain.Orders;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private const string DashboardStatsCacheKey = "DashboardStats";

    public DashboardService(ApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        string cacheKey = $"DashboardStats_{startDate?.Ticks}_{endDate?.Ticks}";
        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.Size = 1;
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60);

            var validStatuses = new[] { OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Processing, OrderStatus.Packed, OrderStatus.Shipped, OrderStatus.Delivered };

            // Determine query date ranges
            DateTime? todayRangeStart = null;
            DateTime? todayRangeEnd = null;
            DateTime? totalRangeStart = null;
            DateTime? totalRangeEnd = null;

            if (startDate.HasValue || endDate.HasValue)
            {
                if (startDate.HasValue)
                    todayRangeStart = startDate.Value.Date.AddHours(-6);
                if (endDate.HasValue)
                    todayRangeEnd = endDate.Value.Date.AddDays(1).AddHours(-6);
            }

            // ── 1. TODAY STATUS AGGREGATIONS (single SQL query) ──────────
            var todayQuery = _context.Orders.AsNoTracking().AsQueryable();
            if (todayRangeStart.HasValue)
                todayQuery = todayQuery.Where(o => o.CreatedAt >= todayRangeStart.Value);
            if (todayRangeEnd.HasValue)
                todayQuery = todayQuery.Where(o => o.CreatedAt <= todayRangeEnd.Value);

            var todayStatusAgg = await todayQuery
                .GroupBy(o => o.Status)
                .Select(g => new
                {
                    Status = g.Key,
                    Count = g.Count(),
                    Revenue = g.Sum(o => o.Total),
                    PreOrderCount = g.Count(o => o.IsPreOrder),
                    PreOrderRevenue = g.Sum(o => o.IsPreOrder ? o.Total : 0)
                })
                .ToListAsync();

            int todayOrdersCount = todayStatusAgg.Sum(x => x.Count);
            decimal todayOrdersRevenue = todayStatusAgg.Sum(x => x.Revenue);
            int todayPendingCount = todayStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Pending)?.Count ?? 0;
            decimal todayPendingRevenue = todayStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Pending)?.Revenue ?? 0;
            int todayConfirmCount = todayStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Confirmed)?.Count ?? 0;
            decimal todayConfirmRevenue = todayStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Confirmed)?.Revenue ?? 0;
            int todayPackagingCount = todayStatusAgg.Where(x => x.Status == OrderStatus.Processing || x.Status == OrderStatus.Packed).Sum(x => x.Count);
            decimal todayPackagingRevenue = todayStatusAgg.Where(x => x.Status == OrderStatus.Processing || x.Status == OrderStatus.Packed).Sum(x => x.Revenue);
            int todayShippedCount = todayStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Shipped)?.Count ?? 0;
            decimal todayShippedRevenue = todayStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Shipped)?.Revenue ?? 0;
            int todayPreOrdersCount = todayStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.PreOrder)?.Count ?? 0
                                      + todayStatusAgg.Sum(x => x.PreOrderCount);
            decimal todayPreOrdersRevenue = todayStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.PreOrder)?.Revenue ?? 0
                                            + todayStatusAgg.Sum(x => x.PreOrderRevenue);

            // ── 1b. TODAY SOURCE MATCHING (single query, process in C#) ─────
            var todaySourceData = await todayQuery
                .Select(o => new { o.Status, o.Total, o.IsPreOrder,
                    DeliveryName = o.DeliveryMethod != null ? o.DeliveryMethod.Name : "",
                    SourceName = o.SourcePage != null ? o.SourcePage.Name : "",
                    SocialName = o.SocialMediaSource != null ? o.SocialMediaSource.Name : ""
                }).ToListAsync();

            var wapaOrders = todaySourceData.Where(o =>
                o.DeliveryName.Contains("Wapa") || o.SourceName.Contains("Wapa") || o.SocialName.Contains("Wapa"));
            int wapaShopCount = wapaOrders.Count();
            decimal wapaShopRevenue = wapaOrders.Sum(o => o.Total);

            var mirpurOrders = todaySourceData.Where(o =>
                o.DeliveryName.Contains("Mirpur") || o.SourceName.Contains("Mirpur") || o.SocialName.Contains("Mirpur"));
            int mirpurShopCount = mirpurOrders.Count();
            decimal mirpurShopRevenue = mirpurOrders.Sum(o => o.Total);

            var pathaoOrders = todaySourceData.Where(o => o.DeliveryName.Contains("Pathao"));
            int pathaoReturnCount = pathaoOrders.Count(o => o.Status == OrderStatus.Return || o.Status == OrderStatus.ReturnProcess);
            decimal pathaoReturnRevenue = pathaoOrders.Where(o => o.Status == OrderStatus.Return || o.Status == OrderStatus.ReturnProcess).Sum(o => o.Total);
            int pathaoDeliveredCount = pathaoOrders.Count(o => o.Status == OrderStatus.Delivered);
            decimal pathaoDeliveredRevenue = pathaoOrders.Where(o => o.Status == OrderStatus.Delivered).Sum(o => o.Total);

            // ── 2. TOTAL/LIFETIME STATUS AGGREGATIONS (single SQL query) ──
            var totalQuery = _context.Orders.AsNoTracking().AsQueryable();
            if (totalRangeStart.HasValue)
                totalQuery = totalQuery.Where(o => o.CreatedAt >= totalRangeStart.Value);
            if (totalRangeEnd.HasValue)
                totalQuery = totalQuery.Where(o => o.CreatedAt <= totalRangeEnd.Value);

            var totalStatusAgg = await totalQuery
                .GroupBy(o => o.Status)
                .Select(g => new
                {
                    Status = g.Key,
                    Count = g.Count(),
                    Revenue = g.Sum(o => o.Total),
                    PreOrderCount = g.Count(o => o.IsPreOrder),
                    PreOrderRevenue = g.Sum(o => o.IsPreOrder ? o.Total : 0)
                })
                .ToListAsync();

            int totalOrders = totalStatusAgg.Sum(x => x.Count);
            decimal totalRevenue = totalStatusAgg.Where(x => validStatuses.Contains(x.Status)).Sum(x => x.Revenue);
            int deliveredOrders = totalStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Delivered)?.Count ?? 0;
            int pendingOrders = totalStatusAgg.Where(x => x.Status == OrderStatus.Pending || x.Status == OrderStatus.Confirmed || x.Status == OrderStatus.Processing).Sum(x => x.Count);
            int returnedOrders = totalStatusAgg.Where(x => x.Status == OrderStatus.Return || x.Status == OrderStatus.ReturnProcess).Sum(x => x.Count);
            decimal returnValue = totalStatusAgg.Where(x => x.Status == OrderStatus.Return || x.Status == OrderStatus.ReturnProcess).Sum(x => x.Revenue);
            var returnRateStr = totalOrders > 0 ? $"{(double)returnedOrders / totalOrders * 100:0.##}%" : "0%";

            int totalPendingCount = totalStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Pending)?.Count ?? 0;
            decimal totalPendingRevenue = totalStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Pending)?.Revenue ?? 0;
            int totalConfirmCount = totalStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Confirmed)?.Count ?? 0;
            decimal totalConfirmRevenue = totalStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Confirmed)?.Revenue ?? 0;
            int totalPackagingCount = totalStatusAgg.Where(x => x.Status == OrderStatus.Processing || x.Status == OrderStatus.Packed).Sum(x => x.Count);
            decimal totalPackagingRevenue = totalStatusAgg.Where(x => x.Status == OrderStatus.Processing || x.Status == OrderStatus.Packed).Sum(x => x.Revenue);
            int totalReturnProcessCount = totalStatusAgg.Where(x => x.Status == OrderStatus.ReturnProcess || x.Status == OrderStatus.Return || x.Status == OrderStatus.Refund).Sum(x => x.Count);
            decimal totalReturnProcessRevenue = totalStatusAgg.Where(x => x.Status == OrderStatus.ReturnProcess || x.Status == OrderStatus.Return || x.Status == OrderStatus.Refund).Sum(x => x.Revenue);
            int totalShippedCount = totalStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Shipped)?.Count ?? 0;
            decimal totalShippedRevenue = totalStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.Shipped)?.Revenue ?? 0;
            int totalPreOrdersCount = totalStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.PreOrder)?.Count ?? 0
                                      + totalStatusAgg.Sum(x => x.PreOrderCount);
            decimal totalPreOrdersRevenue = totalStatusAgg.FirstOrDefault(x => x.Status == OrderStatus.PreOrder)?.Revenue ?? 0
                                            + totalStatusAgg.Sum(x => x.PreOrderRevenue);
            int incompleteOrdersCount = totalStatusAgg.Where(x => x.Status == OrderStatus.Cancelled || x.Status == OrderStatus.Hold || x.Status == OrderStatus.Exchange).Sum(x => x.Count);
            decimal incompleteOrdersRevenue = totalStatusAgg.Where(x => x.Status == OrderStatus.Cancelled || x.Status == OrderStatus.Hold || x.Status == OrderStatus.Exchange).Sum(x => x.Revenue);

            // ── 3. CATALOG METRICS ───────────────────────────────────────
            var totalProducts = await _context.Products.AsNoTracking().CountAsync();
            var totalCustomers = await _context.Customers.AsNoTracking().CountAsync();

            // ── 4. SOLD ITEMS (JOIN instead of correlated subqueries) ─────
            var soldItemsQuery = from i in _context.OrderItems.AsNoTracking()
                                 join o in totalQuery on i.OrderId equals o.Id
                                 select new { i.ProductId, i.Quantity };

            var soldItems = await soldItemsQuery.ToListAsync();

            var distinctProductIds = soldItems.Select(x => x.ProductId).Distinct().ToList();

            var productPurchaseRates = await _context.ProductVariants
                .AsNoTracking()
                .Where(v => distinctProductIds.Contains(v.ProductId))
                .Select(v => new { v.ProductId, v.PurchaseRate, v.Id })
                .ToListAsync();

            var ratesDict = productPurchaseRates
                .GroupBy(v => v.ProductId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(v => v.Id).Select(v => v.PurchaseRate).FirstOrDefault() ?? 0
                );

            var totalItemsSold = soldItems.Sum(s => s.Quantity);
            var totalPurchaseCost = soldItems.Sum(s => s.Quantity * (ratesDict.TryGetValue(s.ProductId, out var r) ? r : 0));
            var avgSellingPrice = totalItemsSold > 0 ? totalRevenue / totalItemsSold : 0;

            return new DashboardStatsDto
            {
                TotalOrders = totalOrders,
                TotalProducts = totalProducts,
                TotalCustomers = totalCustomers,
                TotalRevenue = totalRevenue,
                DeliveredOrders = deliveredOrders,
                PendingOrders = pendingOrders,
                ReturnedOrders = returnedOrders,
                CustomerQueries = 0,
                TotalPurchaseCost = totalPurchaseCost,
                AverageSellingPrice = avgSellingPrice,
                ReturnValue = returnValue,
                ReturnRate = returnRateStr,

                // Row 1
                TodayOrdersCount = todayOrdersCount,
                TodayOrdersRevenue = todayOrdersRevenue,
                TodayPendingCount = todayPendingCount,
                TodayPendingRevenue = todayPendingRevenue,
                TodayConfirmCount = todayConfirmCount,
                TodayConfirmRevenue = todayConfirmRevenue,
                TodayPackagingCount = todayPackagingCount,
                TodayPackagingRevenue = todayPackagingRevenue,
                TodayShippedCount = todayShippedCount,
                TodayShippedRevenue = todayShippedRevenue,
                TodayPreOrdersCount = todayPreOrdersCount,
                TodayPreOrdersRevenue = todayPreOrdersRevenue,
                WapaShopCount = wapaShopCount,
                WapaShopRevenue = wapaShopRevenue,
                MirpurShopCount = mirpurShopCount,
                MirpurShopRevenue = mirpurShopRevenue,
                PathaoReturnCount = pathaoReturnCount,
                PathaoReturnRevenue = pathaoReturnRevenue,
                PathaoDeliveredCount = pathaoDeliveredCount,
                PathaoDeliveredRevenue = pathaoDeliveredRevenue,

                // Row 2
                TotalPendingCount = totalPendingCount,
                TotalPendingRevenue = totalPendingRevenue,
                TotalConfirmCount = totalConfirmCount,
                TotalConfirmRevenue = totalConfirmRevenue,
                TotalPackagingCount = totalPackagingCount,
                TotalPackagingRevenue = totalPackagingRevenue,
                TotalReturnProcessCount = totalReturnProcessCount,
                TotalReturnProcessRevenue = totalReturnProcessRevenue,
                TotalShippedCount = totalShippedCount,
                TotalShippedRevenue = totalShippedRevenue,
                TotalPreOrdersCount = totalPreOrdersCount,
                TotalPreOrdersRevenue = totalPreOrdersRevenue,
                IncompleteOrdersCount = incompleteOrdersCount,
                IncompleteOrdersRevenue = incompleteOrdersRevenue
            };
        }) ?? new DashboardStatsDto();
    }


    public async Task<List<PopularProductDto>> GetPopularProductsAsync()
    {
        var validStatuses = new[] { OrderStatus.Confirmed, OrderStatus.Processing, OrderStatus.Packed, OrderStatus.Shipped, OrderStatus.Delivered };

        // Get top 5 sold product IDs directly from DB
        var topProductIds = await _context.OrderItems
            .AsNoTracking()
            .Where(i => _context.Orders.Any(o => o.Id == i.OrderId && validStatuses.Contains(o.Status)))
            .GroupBy(i => i.ProductId)
            .OrderByDescending(g => g.Sum(i => i.Quantity))
            .Take(5)
            .Select(g => new { ProductId = g.Key, SoldCount = g.Sum(i => i.Quantity) })
            .ToListAsync();

        if (!topProductIds.Any()) return new List<PopularProductDto>();

        var productIds = topProductIds.Select(x => x.ProductId).ToList();

        // Fetch only the relevant products with necessary includes
        var products = await _context.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .ToListAsync();

        var result = products
            .Select(p => new PopularProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Variants.OrderBy(v => v.Id).FirstOrDefault()?.Price ?? 0,
                Stock = p.StockQuantity,
                SoldCount = topProductIds.First(x => x.ProductId == p.Id).SoldCount,
                ImageUrl = p.ImageUrl ?? p.Images.FirstOrDefault()?.Url ?? ""
            })
            .OrderByDescending(x => x.SoldCount)
            .ToList();

        return result;
    }

    public async Task<List<RecentOrderDto>> GetRecentOrdersAsync()
    {
        return await _context.Orders
            .AsNoTracking()
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new RecentOrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerName = o.CustomerName,
                OrderDate = o.CreatedAt,
                Total = o.Total,
                Status = o.Status.ToString(),
                PaymentStatus = "Paid" // Placeholder
            })
            .ToListAsync();
    }
    public async Task<List<SalesDataDto>> GetSalesDataAsync(string period)
    {
        var endDate = DateTime.UtcNow;
        var validStatuses = new[] { OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Processing, OrderStatus.Packed, OrderStatus.Shipped, OrderStatus.Delivered };

        if (period.ToLower() == "year")
        {
            // Group by Month for the last 12 months
            var startDate = new DateTime(endDate.Year, endDate.Month, 1).AddMonths(-11);
            
            var salesData = await _context.Orders
                .AsNoTracking()
                .Where(o => validStatuses.Contains(o.Status) && o.CreatedAt >= startDate)
                .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Amount = g.Sum(o => o.Total)
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month)
                .ToListAsync();

            return salesData.Select(x => new SalesDataDto
            {
                Date = new DateTime(x.Year, x.Month, 1).ToString("MMM yyyy"),
                Amount = x.Amount
            }).ToList();
        }
        else if (period.ToLower() == "all")
        {
            // Group by Year for all time
            var salesData = await _context.Orders
                .AsNoTracking()
                .Where(o => validStatuses.Contains(o.Status))
                .GroupBy(o => o.CreatedAt.Year)
                .Select(g => new
                {
                    Year = g.Key,
                    Amount = g.Sum(o => o.Total)
                })
                .OrderBy(x => x.Year)
                .ToListAsync();

            return salesData.Select(x => new SalesDataDto
            {
                Date = x.Year.ToString(),
                Amount = x.Amount
            }).ToList();
        }
        else
        {
            // Default: Group by Day (week or month)
            var startDate = period.ToLower() == "week" ? endDate.AddDays(-7) : endDate.AddDays(-30);

            var salesData = await _context.Orders
                .AsNoTracking()
                .Where(o => validStatuses.Contains(o.Status) &&
                            o.CreatedAt >= startDate && o.CreatedAt <= endDate)
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Amount = g.Sum(o => o.Total)
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            return salesData.Select(x => new SalesDataDto
            {
                Date = x.Date.ToString("yyyy-MM-dd"),
                Amount = x.Amount
            }).ToList();
        }
    }

    public async Task<List<StatusDistributionDto>> GetOrderStatusDistributionAsync()
    {
        var distribution = await _context.Orders
            .AsNoTracking()
            .GroupBy(o => o.Status)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        return distribution.Select(x => new StatusDistributionDto
        {
            Status = x.Status.ToString(),
            Count = x.Count
        }).ToList();
    }

    public async Task<List<CustomerGrowthDto>> GetCustomerGrowthAsync()
    {
        // Get last 6 months of customer growth
        var startDate = DateTime.UtcNow.AddMonths(-6);

        var growth = await _context.Customers 
            .AsNoTracking()
            .Where(c => c.CreatedAt >= startDate)
            .GroupBy(c => new { c.CreatedAt.Year, c.CreatedAt.Month })
            .Select(g => new 
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Count = g.Count()
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        return growth.Select(x => new CustomerGrowthDto
        {
            Date = $"{x.Year}-{x.Month:00}",
            Count = x.Count
        }).ToList();
    }
}

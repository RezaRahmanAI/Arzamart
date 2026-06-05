using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(15); // Short cache for dynamic filters to remain fresh

            var validStatuses = new[] { OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Processing, OrderStatus.Packed, OrderStatus.Shipped, OrderStatus.Delivered };

            // Determine query date ranges
            DateTime? todayRangeStart;
            DateTime? todayRangeEnd;
            DateTime? totalRangeStart;
            DateTime? totalRangeEnd;

            if (startDate.HasValue && endDate.HasValue)
            {
                todayRangeStart = startDate.Value.Date;
                todayRangeEnd = endDate.Value.Date.AddDays(1).AddTicks(-1);
                totalRangeStart = todayRangeStart;
                totalRangeEnd = todayRangeEnd;
            }
            else
            {
                // Default: today for Row 1, all-time for Row 2
                todayRangeStart = DateTime.UtcNow.Date;
                todayRangeEnd = todayRangeStart.Value.AddDays(1).AddTicks(-1);
                totalRangeStart = null;
                totalRangeEnd = null;
            }

            // 1. Fetch Today/Filtered Period stats in a single DB trip
            var todayQuery = _context.Orders.AsNoTracking().AsQueryable();
            if (todayRangeStart.HasValue)
                todayQuery = todayQuery.Where(o => o.CreatedAt >= todayRangeStart.Value);
            if (todayRangeEnd.HasValue)
                todayQuery = todayQuery.Where(o => o.CreatedAt <= todayRangeEnd.Value);

            var todayStats = await todayQuery
                .Include(o => o.DeliveryMethod)
                .Include(o => o.SourcePage)
                .Include(o => o.SocialMediaSource)
                .Select(o => new
                {
                    o.Total,
                    o.Status,
                    o.IsPreOrder,
                    DeliveryName = o.DeliveryMethod != null ? o.DeliveryMethod.Name : "",
                    SourceName = o.SourcePage != null ? o.SourcePage.Name : "",
                    SocialName = o.SocialMediaSource != null ? o.SocialMediaSource.Name : ""
                })
                .ToListAsync();

            // Calculate row 1 aggregates in memory
            int todayOrdersCount = todayStats.Count;
            decimal todayOrdersRevenue = todayStats.Sum(o => o.Total);
            int todayPendingCount = todayStats.Count(o => o.Status == OrderStatus.Pending);
            decimal todayPendingRevenue = todayStats.Where(o => o.Status == OrderStatus.Pending).Sum(o => o.Total);
            int todayConfirmCount = todayStats.Count(o => o.Status == OrderStatus.Confirmed);
            decimal todayConfirmRevenue = todayStats.Where(o => o.Status == OrderStatus.Confirmed).Sum(o => o.Total);
            int todayPackagingCount = todayStats.Count(o => o.Status == OrderStatus.Processing || o.Status == OrderStatus.Packed);
            decimal todayPackagingRevenue = todayStats.Where(o => o.Status == OrderStatus.Processing || o.Status == OrderStatus.Packed).Sum(o => o.Total);
            int todayShippedCount = todayStats.Count(o => o.Status == OrderStatus.Shipped);
            decimal todayShippedRevenue = todayStats.Where(o => o.Status == OrderStatus.Shipped).Sum(o => o.Total);
            int todayPreOrdersCount = todayStats.Count(o => o.Status == OrderStatus.PreOrder || o.IsPreOrder);
            decimal todayPreOrdersRevenue = todayStats.Where(o => o.Status == OrderStatus.PreOrder || o.IsPreOrder).Sum(o => o.Total);
            
            int wapaShopCount = todayStats.Count(o => o.SourceName.Contains("Wapa") || o.SocialName.Contains("Wapa") || o.DeliveryName.Contains("Wapa"));
            decimal wapaShopRevenue = todayStats.Where(o => o.SourceName.Contains("Wapa") || o.SocialName.Contains("Wapa") || o.DeliveryName.Contains("Wapa")).Sum(o => o.Total);
            int mirpurShopCount = todayStats.Count(o => o.SourceName.Contains("Mirpur") || o.SocialName.Contains("Mirpur") || o.DeliveryName.Contains("Mirpur"));
            decimal mirpurShopRevenue = todayStats.Where(o => o.SourceName.Contains("Mirpur") || o.SocialName.Contains("Mirpur") || o.DeliveryName.Contains("Mirpur")).Sum(o => o.Total);
            
            int pathaoReturnCount = todayStats.Count(o => (o.Status == OrderStatus.Return || o.Status == OrderStatus.ReturnProcess) && o.DeliveryName.Contains("Pathao"));
            decimal pathaoReturnRevenue = todayStats.Where(o => (o.Status == OrderStatus.Return || o.Status == OrderStatus.ReturnProcess) && o.DeliveryName.Contains("Pathao")).Sum(o => o.Total);
            int pathaoDeliveredCount = todayStats.Count(o => o.Status == OrderStatus.Delivered && o.DeliveryName.Contains("Pathao"));
            decimal pathaoDeliveredRevenue = todayStats.Where(o => o.Status == OrderStatus.Delivered && o.DeliveryName.Contains("Pathao")).Sum(o => o.Total);

            // 2. Fetch Total/Lifetime stats
            var totalQuery = _context.Orders.AsNoTracking().AsQueryable();
            if (totalRangeStart.HasValue)
                totalQuery = totalQuery.Where(o => o.CreatedAt >= totalRangeStart.Value);
            if (totalRangeEnd.HasValue)
                totalQuery = totalQuery.Where(o => o.CreatedAt <= totalRangeEnd.Value);

            var totalStatsList = await totalQuery
                .Select(o => new
                {
                    o.Total,
                    o.Status,
                    o.IsPreOrder
                })
                .ToListAsync();

            // Calculate row 2 aggregates
            int totalPendingCount = totalStatsList.Count(o => o.Status == OrderStatus.Pending);
            decimal totalPendingRevenue = totalStatsList.Where(o => o.Status == OrderStatus.Pending).Sum(o => o.Total);
            int totalConfirmCount = totalStatsList.Count(o => o.Status == OrderStatus.Confirmed);
            decimal totalConfirmRevenue = totalStatsList.Where(o => o.Status == OrderStatus.Confirmed).Sum(o => o.Total);
            int totalPackagingCount = totalStatsList.Count(o => o.Status == OrderStatus.Processing || o.Status == OrderStatus.Packed);
            decimal totalPackagingRevenue = totalStatsList.Where(o => o.Status == OrderStatus.Processing || o.Status == OrderStatus.Packed).Sum(o => o.Total);
            int totalReturnProcessCount = totalStatsList.Count(o => o.Status == OrderStatus.ReturnProcess || o.Status == OrderStatus.Return || o.Status == OrderStatus.Refund);
            decimal totalReturnProcessRevenue = totalStatsList.Where(o => o.Status == OrderStatus.ReturnProcess || o.Status == OrderStatus.Return || o.Status == OrderStatus.Refund).Sum(o => o.Total);
            int totalShippedCount = totalStatsList.Count(o => o.Status == OrderStatus.Shipped);
            decimal totalShippedRevenue = totalStatsList.Where(o => o.Status == OrderStatus.Shipped).Sum(o => o.Total);
            int totalPreOrdersCount = totalStatsList.Count(o => o.Status == OrderStatus.PreOrder || o.IsPreOrder);
            decimal totalPreOrdersRevenue = totalStatsList.Where(o => o.Status == OrderStatus.PreOrder || o.IsPreOrder).Sum(o => o.Total);
            int incompleteOrdersCount = totalStatsList.Count(o => o.Status == OrderStatus.Cancelled || o.Status == OrderStatus.Hold || o.Status == OrderStatus.Exchange);
            decimal incompleteOrdersRevenue = totalStatsList.Where(o => o.Status == OrderStatus.Cancelled || o.Status == OrderStatus.Hold || o.Status == OrderStatus.Exchange).Sum(o => o.Total);

            // Fetch catalog metrics
            var totalProducts = await _context.Products.AsNoTracking().CountAsync();
            var totalCustomers = await _context.Customers.AsNoTracking().CountAsync();

            // Calculate legacy metrics with date range applied for consistency
            var totalOrders = totalStatsList.Count;
            var totalRevenue = totalStatsList.Where(o => validStatuses.Contains(o.Status)).Sum(o => o.Total);
            var deliveredOrders = totalStatsList.Count(o => o.Status == OrderStatus.Delivered);
            var pendingOrders = totalStatsList.Count(o => o.Status == OrderStatus.Pending || o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Processing);
            var returnedOrders = totalStatsList.Count(o => o.Status == OrderStatus.Return || o.Status == OrderStatus.ReturnProcess);
            var returnValue = totalStatsList.Where(o => o.Status == OrderStatus.Return || o.Status == OrderStatus.ReturnProcess).Sum(o => o.Total);
            var returnRateStr = totalOrders > 0 ? $"{(double)returnedOrders / totalOrders * 100:0.##}%" : "0%";

            // Item-level query for profit/purchase rates
            var soldItemsQuery = _context.OrderItems.AsNoTracking().Where(i => validStatuses.Contains(i.Order.Status));
            if (totalRangeStart.HasValue)
                soldItemsQuery = soldItemsQuery.Where(i => i.Order.CreatedAt >= totalRangeStart.Value);
            if (totalRangeEnd.HasValue)
                soldItemsQuery = soldItemsQuery.Where(i => i.Order.CreatedAt <= totalRangeEnd.Value);

            var soldItems = await soldItemsQuery
                .Select(i => new
                {
                    i.Quantity,
                    PurchaseRate = _context.ProductVariants
                        .Where(v => v.ProductId == i.ProductId)
                        .OrderBy(v => v.Id)
                        .Select(v => (decimal?)v.PurchaseRate)
                        .FirstOrDefault() ?? 0
                })
                .ToListAsync();

            var totalItemsSold = soldItems.Sum(s => s.Quantity);
            var totalPurchaseCost = soldItems.Sum(s => s.Quantity * s.PurchaseRate);
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
            .Where(i => validStatuses.Contains(i.Order.Status))
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

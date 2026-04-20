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

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        return await _cache.GetOrCreateAsync(DashboardStatsCacheKey, async entry =>
        {
            entry.Size = 1;
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);

            var validStatuses = new[] { OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Processing, OrderStatus.Packed, OrderStatus.Shipped, OrderStatus.Delivered };

            // Sequential queries to avoid DbContext threading issues
            var orderStats = await _context.Orders
                .AsNoTracking()
                .GroupBy(o => 1)
                .Select(g => new
                {
                    TotalOrders = g.Count(),
                    TotalRevenue = g.Where(o => validStatuses.Contains(o.Status)).Sum(o => (decimal?)o.Total) ?? 0,
                    DeliveredOrders = g.Count(o => o.Status == OrderStatus.Delivered),
                    PendingOrders = g.Count(o => o.Status == OrderStatus.Pending || o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Processing),
                    ShippedOrders = g.Count(o => o.Status == OrderStatus.Shipped),
                    CancelledOrders = g.Count(o => o.Status == OrderStatus.Cancelled)
                })
                .FirstOrDefaultAsync();

            var totalProducts = await _context.Products.AsNoTracking().CountAsync();
            var totalCustomers = await _context.Customers.AsNoTracking().CountAsync();
            
            // Optimized query for sold items with purchase rates
            var soldItems = await _context.OrderItems
                .AsNoTracking()
                .Where(i => validStatuses.Contains(i.Order.Status))
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

            var totalOrders = orderStats?.TotalOrders ?? 0;
            var totalRevenue = orderStats?.TotalRevenue ?? 0;
            var totalItemsSold = soldItems.Sum(s => s.Quantity);
            var totalPurchaseCost = soldItems.Sum(s => s.Quantity * s.PurchaseRate);
            var avgSellingPrice = totalItemsSold > 0 ? totalRevenue / totalItemsSold : 0;

            return new DashboardStatsDto
            {
                TotalOrders = totalOrders,
                TotalProducts = totalProducts,
                TotalCustomers = totalCustomers,
                TotalRevenue = totalRevenue,
                DeliveredOrders = orderStats?.DeliveredOrders ?? 0,
                PendingOrders = orderStats?.PendingOrders ?? 0,
                ReturnedOrders = 0,
                CustomerQueries = 0,
                TotalPurchaseCost = totalPurchaseCost,
                AverageSellingPrice = avgSellingPrice,
                ReturnValue = 0,
                ReturnRate = "0%"
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

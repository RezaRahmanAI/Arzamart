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
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);

            var totalOrders = await _context.Orders.AsNoTracking().CountAsync();
            var totalProducts = await _context.Products.AsNoTracking().CountAsync();
            var totalCustomers = await _context.Users.AsNoTracking().CountAsync();
            
            var deliveredOrders = await _context.Orders.AsNoTracking().CountAsync(o => o.Status == OrderStatus.Delivered);
            var pendingOrders = await _context.Orders.AsNoTracking().CountAsync(o => o.Status == OrderStatus.Pending || o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Processing);
            var shippedOrders = await _context.Orders.AsNoTracking().CountAsync(o => o.Status == OrderStatus.Shipped);
            var cancelledOrders = await _context.Orders.AsNoTracking().CountAsync(o => o.Status == OrderStatus.Cancelled);

            // Revenue from Confirmed, Processing, Packed, Shipped, Delivered (All valid sales)
            var validStatuses = new[] { OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Processing, OrderStatus.Packed, OrderStatus.Shipped, OrderStatus.Delivered };

            var totalRevenue = await _context.Orders
                .AsNoTracking()
                .Where(o => validStatuses.Contains(o.Status))
                .SumAsync(o => (decimal?)o.Total) ?? 0;

            // Calculate Average Selling Price (ASP)
            var totalItemsSold = await _context.Orders
                .AsNoTracking()
                .Where(o => validStatuses.Contains(o.Status))
                .SelectMany(o => o.Items)
                .SumAsync(i => (int?)i.Quantity) ?? 0;
                
            var avgSellingPrice = totalItemsSold > 0 ? totalRevenue / totalItemsSold : 0;

            var soldItems = await _context.Orders
                .AsNoTracking()
                .Where(o => validStatuses.Contains(o.Status))
                .SelectMany(o => o.Items)
                .GroupBy(i => i.ProductId)
                .Select(g => new { ProductId = g.Key, Quantity = g.Sum(i => i.Quantity) })
                .ToListAsync();

            var productIds = soldItems.Select(s => s.ProductId).ToList();

            var productCosts = await _context.Products
                .AsNoTracking()
                .Where(p => productIds.Contains(p.Id))
                .Select(p => new
                {
                    p.Id,
                    PurchaseRate = p.Variants.OrderBy(v => v.Id).Select(v => (decimal?)v.PurchaseRate).FirstOrDefault() ?? 0
                })
                .ToDictionaryAsync(p => p.Id, p => p.PurchaseRate);

            var totalPurchaseCost = soldItems.Sum(s => s.Quantity * (productCosts.ContainsKey(s.ProductId) ? productCosts[s.ProductId] : 0));

            return new DashboardStatsDto
            {
                TotalOrders = totalOrders,
                TotalProducts = totalProducts,
                TotalCustomers = totalCustomers,
                TotalRevenue = totalRevenue,
                DeliveredOrders = deliveredOrders,
                PendingOrders = pendingOrders,
                ReturnedOrders = 0, // Placeholder as there's no Return status yet
                CustomerQueries = 0, // Placeholder
                TotalPurchaseCost = totalPurchaseCost,
                AverageSellingPrice = avgSellingPrice,
                ReturnValue = 0,
                ReturnRate = "0%"
            };
        }) ?? new DashboardStatsDto();
    }


    public async Task<List<PopularProductDto>> GetPopularProductsAsync()
    {
        var products = await _context.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Select(p => new
            {
                Product = p,
                SoldCount = _context.Orders
                    .AsNoTracking()
                    .Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Processing || o.Status == OrderStatus.Packed || o.Status == OrderStatus.Shipped || o.Status == OrderStatus.Delivered)
                    .SelectMany(o => o.Items)
                    .Where(i => i.ProductId == p.Id)
                    .Sum(i => (int?)i.Quantity) ?? 0
            })
            .OrderByDescending(x => x.SoldCount)
            .Take(5)
            .ToListAsync();

        return products.Select(x => new PopularProductDto
        {
            Id = x.Product.Id,
            Name = x.Product.Name,
            Price = x.Product.Variants.FirstOrDefault()?.Price ?? 0,
            Stock = x.Product.StockQuantity,
            SoldCount = x.SoldCount,
            ImageUrl = x.Product.ImageUrl ?? x.Product.Images.FirstOrDefault()?.Url ?? ""
        }).ToList();
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

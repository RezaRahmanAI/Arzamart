using System;
using System.Threading.Tasks;
using ECommerce.Core.DTOs.Analytics;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMemoryCache _cache;

    public AnalyticsService(IUnitOfWork unitOfWork, IMemoryCache cache)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
    }

    public async Task<DailyTrafficDto> GetDailyTrafficAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var cacheKey = $"analytics_daily:{today}";

        if (_cache.TryGetValue(cacheKey, out DailyTrafficDto cached))
            return cached;

        var traffic = await _unitOfWork.Repository<DailyTraffic>().GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Date == today);

        var result = new DailyTrafficDto
        {
            Date = today,
            PageViews = traffic?.PageViews ?? 0,
            UniqueVisitors = traffic?.UniqueVisitors ?? 0
        };

        _cache.Set(cacheKey, result, TimeSpan.FromSeconds(30));
        return result;
    }
}

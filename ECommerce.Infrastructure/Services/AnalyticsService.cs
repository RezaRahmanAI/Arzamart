using System;
using System.Threading.Tasks;
using ECommerce.Core.DTOs.Analytics;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly IUnitOfWork _unitOfWork;

    public AnalyticsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DailyTrafficDto> GetDailyTrafficAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var traffic = await _unitOfWork.Repository<DailyTraffic>().GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Date == today);

        return new DailyTrafficDto
        {
            Date = today,
            PageViews = traffic?.PageViews ?? 0,
            UniqueVisitors = traffic?.UniqueVisitors ?? 0
        };
    }
}

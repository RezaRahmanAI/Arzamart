using ECommerce.Core.DTOs.Analytics;

namespace ECommerce.Core.Interfaces;

public interface IAnalyticsService
{
    Task<DailyTrafficDto> GetDailyTrafficAsync();
}

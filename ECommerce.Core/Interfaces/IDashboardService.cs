using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<List<RecentOrderDto>> GetRecentOrdersAsync();
    Task<List<PopularProductDto>> GetPopularProductsAsync();
    Task<List<SalesDataDto>> GetSalesDataAsync(string period);
    Task<List<StatusDistributionDto>> GetOrderStatusDistributionAsync();
    Task<List<CustomerGrowthDto>> GetCustomerGrowthAsync();
}

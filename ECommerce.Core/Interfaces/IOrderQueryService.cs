using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IOrderQueryService
{
    Task<PaginationDto<OrderDto>> GetOrdersAsync(int page = 1, int pageSize = 10);
    Task<IReadOnlyList<OrderDto>> GetOrdersByPhoneAsync(string phone);
    Task<OrderDto?> GetOrderByIdAsync(int id);
    Task<(IReadOnlyList<OrderDto> Items, int Total)> GetOrdersForAdminAsync(
        string? searchTerm, string? status, string? dateRange, 
        int page, int pageSize, 
        bool preOrderOnly = false, bool websiteOnly = false, bool manualOnly = false,
        DateTime? startDate = null, DateTime? endDate = null,
        int? sourcePageId = null, int? socialMediaSourceId = null,
        string? customerPhone = null, int? productId = null, string? orderNumber = null);
    Task<OrderStatsDto> GetOrderStatsAsync(
        string? searchTerm, string? status, string? dateRange,
        bool preOrderOnly = false, bool websiteOnly = false, bool manualOnly = false,
        DateTime? startDate = null, DateTime? endDate = null,
        int? sourcePageId = null, int? socialMediaSourceId = null,
        string? customerPhone = null, int? productId = null, string? orderNumber = null);
}
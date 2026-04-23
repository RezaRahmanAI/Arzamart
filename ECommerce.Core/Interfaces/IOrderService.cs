using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(OrderCreateDto orderDto);
    Task<IReadOnlyList<OrderDto>> GetOrdersAsync();
    Task<(IReadOnlyList<OrderDto> Items, int Total)> GetOrdersForAdminAsync(string? searchTerm, string? status, string? dateRange, int page, int pageSize, bool preOrderOnly = false, bool websiteOnly = false, bool manualOnly = false, DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null, int? socialMediaSourceId = null, string? customerPhone = null, int? productId = null, string? orderNumber = null);
    Task<OrderDto?> GetOrderByIdAsync(int id);
    Task<bool> UpdateOrderStatusAsync(int id, string status, string? updatedBy = null, string? note = null);
    Task<OrderDto> UpdateOrderAsync(int id, OrderCreateDto orderDto);
    Task<OrderDto> AddOrderNoteAsync(int id, string adminName, string note);
    Task<OrderStatsDto> GetOrderStatsAsync(string? searchTerm, string? status, string? dateRange, bool preOrderOnly = false, bool websiteOnly = false, bool manualOnly = false, DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null, int? socialMediaSourceId = null, string? customerPhone = null, int? productId = null, string? orderNumber = null);
    Task<bool> TransferToMainOrderAsync(int id, string? adminName);
}

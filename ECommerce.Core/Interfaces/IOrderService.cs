using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(OrderCreateDto orderDto);
    Task<IReadOnlyList<OrderDto>> GetOrdersAsync();
    Task<(IReadOnlyList<OrderDto> Items, int Total)> GetOrdersForAdminAsync(string? searchTerm, string? status, string? dateRange, int page, int pageSize);
    Task<OrderDto?> GetOrderByIdAsync(int id);
    Task<bool> UpdateOrderStatusAsync(int id, string status);
}

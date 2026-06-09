using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IOrderCommandService
{
    Task<OrderDto> CreateOrderAsync(OrderCreateDto orderDto);
    Task<OrderDto> UpdateOrderAsync(int id, OrderCreateDto orderDto);
    Task<OrderDto> AddOrderNoteAsync(int id, string adminName, string note);
    Task<bool> TransferToMainOrderAsync(int id, string? adminName);
}
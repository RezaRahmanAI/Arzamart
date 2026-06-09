using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IOrderStatusService
{
    Task<bool> UpdateOrderStatusAsync(int id, string status, string? updatedBy = null, string? note = null);
}
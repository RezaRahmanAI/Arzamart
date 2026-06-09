using ECommerce.Core.Domain.Orders;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Enums;

namespace ECommerce.Core.Interfaces;

public interface IOrderStockService
{
    bool ShouldDeductStock(OrderStatus status);
    Task AdjustStockOnStatusChangeAsync(Entities.Order order, bool returnToStock);
    Task PopulateItemsStockStatusAsync(Entities.Order order, OrderDto dto);
    Task<bool> CheckIsProductStockAvailableAsync(Product product, int quantity, string? size);
    Task<bool> CalculateIsStockAvailableAsync(Entities.Order order);
    Task ProcessProductStockAdjustmentAsync(Product product, int quantity, string? size, bool returnToStock);
}
using System;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Specifications;
using ECommerce.Infrastructure.Data;

namespace ECommerce.Infrastructure.Services;

public class OrderStatusService : IOrderStatusService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOrderStockService _stockService;

    public OrderStatusService(IUnitOfWork unitOfWork, IOrderStockService stockService)
    {
        _unitOfWork = unitOfWork;
        _stockService = stockService;
    }

    public async Task<bool> UpdateOrderStatusAsync(int id, string status, string? updatedBy = null, string? note = null)
    {
        var spec = new BaseSpecification<Order>(x => x.Id == id);
        spec.AddInclude(x => x.Items);
        spec.AddInclude(x => x.Logs);
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);

        if (order == null) return false;

        if (Enum.TryParse<ECommerce.Core.Domain.Orders.OrderStatus>(status, true, out var newStatus))
        {
            var oldStatus = order.Status;

            bool wasDeducted = _stockService.ShouldDeductStock(oldStatus) && !order.IsPreOrder;
            bool shouldBeDeducted = _stockService.ShouldDeductStock(newStatus) && !order.IsPreOrder;

            if (wasDeducted && !shouldBeDeducted)
            {
                await _stockService.AdjustStockOnStatusChangeAsync(order, returnToStock: true);
            }
            else if (!wasDeducted && shouldBeDeducted)
            {
                await _stockService.AdjustStockOnStatusChangeAsync(order, returnToStock: false);
            }

            if (newStatus == ECommerce.Core.Domain.Orders.OrderStatus.PreOrder)
            {
                order.IsPreOrder = true;
            }

            order.Status = newStatus;

            var log = new OrderLog
            {
                OrderId = order.Id,
                StatusFrom = oldStatus.ToString(),
                StatusTo = newStatus.ToString(),
                ChangedBy = updatedBy ?? "System",
                Note = note,
                CreatedAt = DateTime.UtcNow
            };
            _unitOfWork.Repository<OrderLog>().Add(log);

            _unitOfWork.Repository<Order>().Update(order);
            return await _unitOfWork.Complete() > 0;
        }

        return false;
    }
}

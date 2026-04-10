using System;
using System.Linq.Expressions;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class OrdersWithFiltersForAdminSpecification : BaseSpecification<Order>
{
    public OrdersWithFiltersForAdminSpecification(string? searchTerm, string? status, string? dateRange, bool preOrderOnly = false, DateTime? startDate = null, DateTime? endDate = null) 
        : base(GenerateCriteria(searchTerm, status, dateRange, preOrderOnly, startDate, endDate))
    {
        AddInclude(o => o.Items);
        AddInclude(o => o.Logs);
        AddInclude(o => o.Notes);
        AddOrderByDescending(o => o.CreatedAt);
    }

    private static Expression<Func<Order, bool>> GenerateCriteria(string? searchTerm, string? status, string? dateRange, bool preOrderOnly, DateTime? startDate, DateTime? endDate)
    {
        OrderStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status) && status != "All")
        {
            if (Enum.TryParse<OrderStatus>(status, true, out var result))
                statusEnum = result;
        }

        return o => 
            (preOrderOnly ? o.IsPreOrder : !o.IsPreOrder) &&
            (string.IsNullOrEmpty(searchTerm) || o.OrderNumber.Contains(searchTerm) || o.CustomerName.Contains(searchTerm) || o.CustomerPhone.Contains(searchTerm)) &&
            (!statusEnum.HasValue || o.Status == statusEnum.Value) &&
            (
                (startDate.HasValue && endDate.HasValue) ? (o.CreatedAt >= startDate.Value && o.CreatedAt < endDate.Value.AddDays(1)) :
                (string.IsNullOrEmpty(dateRange) || dateRange == "All Time" || 
                 (dateRange == "Today" && o.CreatedAt >= DateTime.UtcNow.Date) ||
                 (dateRange == "Yesterday" && o.CreatedAt >= DateTime.UtcNow.Date.AddDays(-1) && o.CreatedAt < DateTime.UtcNow.Date) ||
                 (dateRange == "Last 7 Days" && o.CreatedAt >= DateTime.UtcNow.AddDays(-7)) ||
                 (dateRange == "Last 30 Days" && o.CreatedAt >= DateTime.UtcNow.AddDays(-30))
                )
            );
    }
}

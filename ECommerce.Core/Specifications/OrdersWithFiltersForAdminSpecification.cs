using System;
using System.Linq.Expressions;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class OrdersWithFiltersForAdminSpecification : BaseSpecification<Order>
{
    public OrdersWithFiltersForAdminSpecification(string? searchTerm, string? status, string? dateRange) 
        : base(o => 
            (string.IsNullOrEmpty(searchTerm) || o.OrderNumber.Contains(searchTerm) || o.CustomerName.Contains(searchTerm) || o.CustomerPhone.Contains(searchTerm)) &&
            (string.IsNullOrEmpty(status) || status == "All" || o.Status.ToString() == status) &&
            (string.IsNullOrEmpty(dateRange) || dateRange == "All Time" || 
             (dateRange == "Today" && o.CreatedAt >= DateTime.UtcNow.Date) ||
             (dateRange == "Yesterday" && o.CreatedAt >= DateTime.UtcNow.Date.AddDays(-1) && o.CreatedAt < DateTime.UtcNow.Date) ||
             (dateRange == "Last 7 Days" && o.CreatedAt >= DateTime.UtcNow.AddDays(-7)) ||
             (dateRange == "Last 30 Days" && o.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            )
        )
    {
        AddInclude(o => o.Items);
        AddOrderByDescending(o => o.CreatedAt);
    }
}

using System;
using System.Linq.Expressions;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class OrdersWithFiltersForAdminSpecification : BaseSpecification<Order>
{
    public OrdersWithFiltersForAdminSpecification(string? searchTerm, string? status, string? dateRange, bool preOrderOnly = false, bool websiteOnly = false, bool manualOnly = false, DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null, int? socialMediaSourceId = null, string? customerPhone = null, int? productId = null, string? orderNumber = null) 
        : base(GenerateCriteria(searchTerm, status, dateRange, preOrderOnly, websiteOnly, manualOnly, startDate, endDate, sourcePageId, socialMediaSourceId, customerPhone, productId, orderNumber))
    {
        AddInclude(o => o.Items);
        AddInclude(o => o.Logs);
        AddInclude(o => o.Notes);
        AddInclude(o => o.SourcePage!);
        AddInclude(o => o.SocialMediaSource!);
        AddOrderByDescending(o => o.CreatedAt);
    }

    private static Expression<Func<Order, bool>> GenerateCriteria(string? searchTerm, string? status, string? dateRange, bool preOrderOnly, bool websiteOnly, bool manualOnly, DateTime? startDate, DateTime? endDate, int? sourcePageId, int? socialMediaSourceId, string? customerPhone, int? productId, string? orderNumber)
    {
        OrderStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status) && status != "All")
        {
            if (Enum.TryParse<OrderStatus>(status, true, out var result))
                statusEnum = result;
        }

        return o => 
            (preOrderOnly ? o.IsPreOrder : (status == "All" || !string.IsNullOrEmpty(status) ? true : !o.IsPreOrder)) &&
            (!websiteOnly || (!o.SourcePageId.HasValue && !o.SocialMediaSourceId.HasValue)) &&
            (!manualOnly || (o.SourcePageId.HasValue || o.SocialMediaSourceId.HasValue)) &&
            (string.IsNullOrEmpty(searchTerm) || o.OrderNumber.Contains(searchTerm) || o.CustomerName.Contains(searchTerm) || o.CustomerPhone.Contains(searchTerm)) &&
            (string.IsNullOrEmpty(orderNumber) || o.OrderNumber.Contains(orderNumber)) &&
            (string.IsNullOrEmpty(customerPhone) || o.CustomerPhone.Contains(customerPhone)) &&
            (!statusEnum.HasValue || o.Status == statusEnum.Value) &&
            (!sourcePageId.HasValue || o.SourcePageId == sourcePageId.Value) &&
            (!socialMediaSourceId.HasValue || o.SocialMediaSourceId == socialMediaSourceId.Value) &&
            (!productId.HasValue || o.Items.Any(item => item.ProductId == productId.Value)) &&
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

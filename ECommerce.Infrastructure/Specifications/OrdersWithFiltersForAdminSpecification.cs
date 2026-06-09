using System;
using System.Linq;
using System.Linq.Expressions;
using ECommerce.Core.Domain.Orders;
using ECommerce.Core.Entities;

namespace ECommerce.Infrastructure.Specifications;

public class OrdersWithFiltersForAdminSpecification : BaseSpecification<ECommerce.Core.Entities.Order>
{
    public OrdersWithFiltersForAdminSpecification(string? searchTerm, string? status, string? dateRange, bool preOrderOnly = false, bool websiteOnly = false, bool manualOnly = false, DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null, int? socialMediaSourceId = null, string? customerPhone = null, int? productId = null, string? orderNumber = null) 
        : base(GenerateCriteria(searchTerm, status, dateRange, preOrderOnly, websiteOnly, manualOnly, startDate, endDate, sourcePageId, socialMediaSourceId, customerPhone, productId, orderNumber))
    {
        AddInclude(o => o.Logs);
        AddInclude(o => o.Notes);
        AddInclude(o => o.SourcePage!);
        AddInclude(o => o.SocialMediaSource!);
        AddOrderByDescending(o => o.CreatedAt);
    }

    private static Expression<Func<ECommerce.Core.Entities.Order, bool>> GenerateCriteria(string? searchTerm, string? status, string? dateRange, bool preOrderOnly, bool websiteOnly, bool manualOnly, DateTime? startDate, DateTime? endDate, int? sourcePageId, int? socialMediaSourceId, string? customerPhone, int? productId, string? orderNumber)
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
                (startDate.HasValue || endDate.HasValue) ? 
                (
                    (!startDate.HasValue || o.CreatedAt >= startDate.Value.Date.AddHours(-6)) && 
                    (!endDate.HasValue || o.CreatedAt < endDate.Value.Date.AddDays(1).AddHours(-6))
                ) :
                (string.IsNullOrEmpty(dateRange) || dateRange == "All Time" || 
                 (dateRange == "Today" && o.CreatedAt >= DateTime.UtcNow.AddHours(6).Date.AddHours(-6) && o.CreatedAt < DateTime.UtcNow.AddHours(6).Date.AddDays(1).AddHours(-6)) ||
                 (dateRange == "Yesterday" && o.CreatedAt >= DateTime.UtcNow.AddHours(6).Date.AddDays(-1).AddHours(-6) && o.CreatedAt < DateTime.UtcNow.AddHours(6).Date.AddHours(-6)) ||
                 (dateRange == "Last 7 Days" && o.CreatedAt >= DateTime.UtcNow.AddHours(6).Date.AddDays(-7).AddHours(-6) && o.CreatedAt < DateTime.UtcNow.AddHours(6).Date.AddDays(1).AddHours(-6)) ||
                 (dateRange == "Last 30 Days" && o.CreatedAt >= DateTime.UtcNow.AddHours(6).Date.AddDays(-30).AddHours(-6) && o.CreatedAt < DateTime.UtcNow.AddHours(6).Date.AddDays(1).AddHours(-6)) ||
                 (dateRange == "This Year" && o.CreatedAt >= new DateTime(DateTime.UtcNow.AddHours(6).Year, 1, 1).AddHours(-6) && o.CreatedAt < new DateTime(DateTime.UtcNow.AddHours(6).Year + 1, 1, 1).AddHours(-6))
                )
            );
    }
}

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

        var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Dhaka");
        var utcNow = DateTime.UtcNow;
        var bdNow = TimeZoneInfo.ConvertTimeFromUtc(utcNow, tz);
        var bdTodayMidnight = bdNow.Date;

        var todayStartUtc = TimeZoneInfo.ConvertTimeToUtc(bdTodayMidnight, tz);
        var todayEndUtc = TimeZoneInfo.ConvertTimeToUtc(bdTodayMidnight.AddDays(1), tz);
        var yesterdayStartUtc = TimeZoneInfo.ConvertTimeToUtc(bdTodayMidnight.AddDays(-1), tz);
        var last7StartUtc = TimeZoneInfo.ConvertTimeToUtc(bdTodayMidnight.AddDays(-7), tz);
        var last30StartUtc = TimeZoneInfo.ConvertTimeToUtc(bdTodayMidnight.AddDays(-30), tz);
        var thisYearStartUtc = TimeZoneInfo.ConvertTimeToUtc(new DateTime(bdNow.Year, 1, 1), tz);
        var nextYearStartUtc = TimeZoneInfo.ConvertTimeToUtc(new DateTime(bdNow.Year + 1, 1, 1), tz);

        DateTime? effectiveStartDate = startDate.HasValue
            ? TimeZoneInfo.ConvertTimeToUtc(startDate.Value.Date, tz)
            : null;
        DateTime? effectiveEndDate = endDate.HasValue
            ? TimeZoneInfo.ConvertTimeToUtc(endDate.Value.Date.AddDays(1), tz)
            : null;

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
                (effectiveStartDate.HasValue || effectiveEndDate.HasValue) ? 
                (
                    (!effectiveStartDate.HasValue || o.CreatedAt >= effectiveStartDate.Value) && 
                    (!effectiveEndDate.HasValue || o.CreatedAt < effectiveEndDate.Value)
                ) :
                (string.IsNullOrEmpty(dateRange) || dateRange == "All Time" || 
                 (dateRange == "Today" && o.CreatedAt >= todayStartUtc && o.CreatedAt < todayEndUtc) ||
                 (dateRange == "Yesterday" && o.CreatedAt >= yesterdayStartUtc && o.CreatedAt < todayStartUtc) ||
                 (dateRange == "Last 7 Days" && o.CreatedAt >= last7StartUtc && o.CreatedAt < todayEndUtc) ||
                 (dateRange == "Last 30 Days" && o.CreatedAt >= last30StartUtc && o.CreatedAt < todayEndUtc) ||
                 (dateRange == "This Year" && o.CreatedAt >= thisYearStartUtc && o.CreatedAt < nextYearStartUtc)
                )
            );
    }
}

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Enums;

namespace ECommerce.Core.Interfaces;

public interface IIncompleteOrderService
{
    Task<OrderDto> AutosaveIncompleteOrderAsync(IncompleteOrderAutosaveDto dto, string? ipAddress, string? userAgent);
    Task<(IReadOnlyList<OrderDto> Items, int Total)> GetIncompleteOrdersForAdminAsync(
        string? searchTerm, string? status, string? dateRange, int page, int pageSize, 
        DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null);
    Task<IncompleteOrderStatsDto> GetIncompleteOrderStatsAsync(
        string? searchTerm, string? status, string? dateRange, 
        DateTime? startDate = null, DateTime? endDate = null, int? sourcePageId = null);
    Task<bool> UpdateIncompleteOrderStatusAsync(int id, OrderStatus status, string? updatedBy, string? note);
    Task<OrderDto> ConvertIncompleteToRealOrderAsync(int id, string? adminName);
}

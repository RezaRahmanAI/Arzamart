using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/incomplete-orders")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("orders")]
public class AdminIncompleteOrdersController : ControllerBase
{
    private readonly IIncompleteOrderService _incompleteOrderService;

    public AdminIncompleteOrdersController(IIncompleteOrderService incompleteOrderService)
    {
        _incompleteOrderService = incompleteOrderService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponseDto<OrderDto>>> GetIncompleteOrders(
        [FromQuery] string? searchTerm,
        [FromQuery] string? status,
        [FromQuery] string? dateRange,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int? sourcePageId = null)
    {
        pageSize = Math.Min(Math.Max(1, pageSize), 100);
        var (items, total) = await _incompleteOrderService.GetIncompleteOrdersForAdminAsync(
            searchTerm, status, dateRange, page, pageSize, startDate, endDate, sourcePageId);
        
        return Ok(new PagedResponseDto<OrderDto> { Items = items, Total = total });
    }

    [HttpGet("stats")]
    public async Task<ActionResult<IncompleteOrderStatsDto>> GetIncompleteOrderStats(
        [FromQuery] string? searchTerm,
        [FromQuery] string? status,
        [FromQuery] string? dateRange,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int? sourcePageId = null)
    {
        var stats = await _incompleteOrderService.GetIncompleteOrderStatsAsync(
            searchTerm, status, dateRange, startDate, endDate, sourcePageId);
        
        return Ok(stats);
    }

    [HttpPost("{id}/status")]
    public async Task<ActionResult> UpdateIncompleteOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        if (!Enum.TryParse<OrderStatus>(dto.Status, true, out var statusEnum))
        {
            return BadRequest(new { message = "Invalid status value" });
        }

        var adminName = GetCurrentAdminName();
        var success = await _incompleteOrderService.UpdateIncompleteOrderStatusAsync(id, statusEnum, adminName, dto.Note);
        if (!success)
        {
            return BadRequest(new { message = "Error updating incomplete order status" });
        }

        return Ok(new { message = "Incomplete order status updated successfully" });
    }

    [HttpPost("{id}/convert")]
    public async Task<ActionResult<OrderDto>> ConvertIncompleteToRealOrder(int id)
    {
        try
        {
            var adminName = GetCurrentAdminName();
            var result = await _incompleteOrderService.ConvertIncompleteToRealOrderAsync(id, adminName);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetCurrentAdminName()
    {
        return User.Identity?.Name 
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value 
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
               ?? "Unknown";
    }
}

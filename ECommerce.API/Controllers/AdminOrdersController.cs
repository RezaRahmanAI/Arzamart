using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("orders")]
public class AdminOrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public AdminOrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponseDto<OrderDto>>> GetOrders(
        [FromQuery] OrderQueryDto query)
    {
        query.PageSize = Math.Min(Math.Max(1, query.PageSize), 100);
        var (items, total) = await _orderService.GetOrdersForAdminAsync(query.SearchTerm, query.Status, query.DateRange, query.Page, query.PageSize, query.PreOrderOnly, query.WebsiteOnly, query.ManualOnly, query.StartDate, query.EndDate, query.SourcePageId, query.SocialMediaSourceId, query.CustomerPhone, query.ProductId, query.OrderNumber);
        return Ok(new PagedResponseDto<OrderDto> { Items = items, Total = total });
    }

    [HttpGet("stats")]
    public async Task<ActionResult<OrderStatsDto>> GetOrderStats(
        [FromQuery] string? searchTerm,
        [FromQuery] string? status,
        [FromQuery] string? dateRange,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] bool preOrderOnly = false,
        [FromQuery] bool websiteOnly = false,
        [FromQuery] bool manualOnly = false,
        [FromQuery] int? sourcePageId = null,
        [FromQuery] int? socialMediaSourceId = null,
        [FromQuery] string? customerPhone = null,
        [FromQuery] int? productId = null,
        [FromQuery] string? orderNumber = null)
    {
        var stats = await _orderService.GetOrderStatsAsync(searchTerm, status, dateRange, preOrderOnly, websiteOnly, manualOnly, startDate, endDate, sourcePageId, socialMediaSourceId, customerPhone, productId, orderNumber);
        return Ok(stats);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null) return NotFound();
        return Ok(order);
    }

    [HttpPost("{id}/status")]
    public async Task<ActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var adminName = GetCurrentAdminName();
        var success = await _orderService.UpdateOrderStatusAsync(id, dto.Status, adminName, dto.Note);
        if (!success) return BadRequest(new { message = "Error updating order status" });

        return Ok(new { message = "Order status updated successfully" });
    }

    [HttpPost("{id}/notes")]
    public async Task<ActionResult<OrderDto>> AddNote(int id, [FromBody] AddNoteDto dto)
    {
        var adminName = GetCurrentAdminName();
        try 
        {
            var updatedOrder = await _orderService.AddOrderNoteAsync(id, adminName, dto.Note);
            return Ok(updatedOrder);
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

    [HttpPost("{id}")]
    public async Task<ActionResult<OrderDto>> UpdateOrder(int id, [FromBody] OrderCreateDto dto)
    {
        try 
        {
            var updatedOrder = await _orderService.UpdateOrderAsync(id, dto);
            return Ok(updatedOrder);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/transfer")]
    public async Task<ActionResult> TransferToMainOrder(int id)
    {
        var adminName = GetCurrentAdminName();
        var success = await _orderService.TransferToMainOrderAsync(id, adminName);
        if (!success) return BadRequest(new { message = "Error transferring order to main pool" });

        return Ok(new { message = "Order transferred to main pool successfully" });
    }
}

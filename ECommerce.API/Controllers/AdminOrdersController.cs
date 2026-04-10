using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminOrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public AdminOrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetOrders(
        [FromQuery] string? searchTerm,
        [FromQuery] string? status,
        [FromQuery] string? dateRange,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] bool preOrderOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (items, total) = await _orderService.GetOrdersForAdminAsync(searchTerm, status, dateRange, page, pageSize, preOrderOnly, startDate, endDate);
        // Ensure properties are lowercase to match frontend expectations if JSON serialization doesn't do it automatically
        return Ok(new { items, total });
    }

    [HttpGet("filtered")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetFilteredOrders(
        [FromQuery] string? searchTerm,
        [FromQuery] string? status,
        [FromQuery] string? dateRange,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] bool preOrderOnly = false)
    {
        // Fetch all matching orders for stats calculation (page 1, max size)
        var (items, _) = await _orderService.GetOrdersForAdminAsync(searchTerm, status, dateRange, 1, 100000, preOrderOnly, startDate, endDate);
        return Ok(items);
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
        // Prioritize Full Name/Display Name claim, then UserName/Email, finally fallback to "Admin"
        return User.Identity?.Name 
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value 
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
               ?? "Admin";
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
}

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class AddNoteDto
{
    public string Note { get; set; } = string.Empty;
}

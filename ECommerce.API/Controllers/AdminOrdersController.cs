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
[Authorize(Roles = "Admin")]
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
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (items, total) = await _orderService.GetOrdersForAdminAsync(searchTerm, status, dateRange, page, pageSize);
        // Ensure properties are lowercase to match frontend expectations if JSON serialization doesn't do it automatically
        return Ok(new { items, total });
    }

    [HttpGet("filtered")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetFilteredOrders(
        [FromQuery] string? searchTerm,
        [FromQuery] string? status,
        [FromQuery] string? dateRange)
    {
        // Fetch all matching orders for stats calculation (page 1, max size)
        var (items, _) = await _orderService.GetOrdersForAdminAsync(searchTerm, status, dateRange, 1, 100000);
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
        var success = await _orderService.UpdateOrderStatusAsync(id, dto.Status);
        if (!success) return BadRequest(new { message = "Error updating order status" });

        return Ok(new { message = "Order status updated successfully" });
    }
}

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
}

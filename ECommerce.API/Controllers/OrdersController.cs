using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ApplicationDbContext _context;

    public OrdersController(IOrderService orderService, ApplicationDbContext context)
    {
        _orderService = orderService;
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<dynamic>> CreateOrder(OrderCreateDto orderDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (string.IsNullOrWhiteSpace(orderDto.Name))
        {
            return BadRequest(new { message = "Customer name is required" });
        }

        if (string.IsNullOrWhiteSpace(orderDto.Phone))
        {
            return BadRequest(new { message = "Phone number is required" });
        }

        // Check if customer is suspicious
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Phone == orderDto.Phone);
        if (customer != null && customer.IsSuspicious)
        {
            return StatusCode(403, new { success = false, message = "Your account has been suspended. Please contact support." });
        }

        if (string.IsNullOrWhiteSpace(orderDto.Address))
        {
            return BadRequest(new { message = "Shipping address is required" });
        }

        if (orderDto.Items == null || !orderDto.Items.Any())
        {
            return BadRequest(new { message = "Order must contain at least one item" });
        }

        // Fix: Treat 0 as null for DeliveryMethodId to avoid FK violation
        if (orderDto.DeliveryMethodId == 0)
        {
            orderDto.DeliveryMethodId = null;
        }

        try
        {
            var order = await _orderService.CreateOrderAsync(orderDto);
            return Ok(order);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetOrders()
    {
        return Ok(await _orderService.GetOrdersAsync());
    }
}

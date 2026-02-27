using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
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
            
            // Return format expected by frontend:
            // { orderId: string, name, phone, address, deliveryDetails, itemsCount, total, createdAt }
            return Ok(new 
            {
                orderId = order.Id, // Return as numeric ID
                name = order.CustomerName,
                phone = order.CustomerPhone,
                address = order.ShippingAddress,
                itemsCount = order.Items.Sum(i => i.Quantity),
                total = order.Total,
                createdAt = order.CreatedAt
            });
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

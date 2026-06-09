using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ICustomerService _customerService;

    public OrdersController(IOrderService orderService, ICustomerService customerService)
    {
        _orderService = orderService;
        _customerService = customerService;
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

        var customer = await _customerService.GetCustomerByPhoneAsync(orderDto.Phone);
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

        if (orderDto.DeliveryMethodId == 0)
        {
            orderDto.DeliveryMethodId = null;
        }

        try
        {
            var order = await _orderService.CreateOrderAsync(orderDto);

            var sessionId = Request.Headers["X-Session-Id"].ToString();
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            await _orderService.ClearCartAsync(userId, sessionId);

            return Ok(order);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<PaginationDto<OrderDto>>> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        pageSize = Math.Min(Math.Max(1, pageSize), 100);
        return Ok(await _orderService.GetOrdersAsync(page, pageSize));
    }
}

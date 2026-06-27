using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using ECommerce.API.Hubs;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ICustomerService _customerService;
    private readonly ILogger<OrdersController> _logger;
    private readonly IHubContext<OrderHub> _hubContext;

    public OrdersController(IOrderService orderService, ICustomerService customerService, ILogger<OrdersController> logger, IHubContext<OrderHub> hubContext)
    {
        _orderService = orderService;
        _customerService = customerService;
        _logger = logger;
        _hubContext = hubContext;
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> CreateOrder(OrderCreateDto orderDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var order = await _orderService.CreateOrderAsync(orderDto);

            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveOrderNotification", order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SignalR live order notification for OrderNumber {OrderNumber}", order.OrderNumber);
            }

            try
            {
                var sessionId = Request.Headers["X-Session-Id"].ToString();
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                await _orderService.ClearCartAsync(userId, sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clear cart after successful order creation for phone {Phone}", orderDto.Phone);
            }

            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<PaginationDto<OrderDto>>> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        pageSize = Math.Min(Math.Max(1, pageSize), 100);
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Ok(await _orderService.GetOrdersAsync(userId, page, pageSize));
    }
}

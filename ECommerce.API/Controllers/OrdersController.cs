using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
    private readonly IIncompleteOrderService _incompleteOrderService;
    private readonly ILogger<OrdersController> _logger;
    private readonly IHubContext<OrderHub> _hubContext;

    public OrdersController(
        IOrderService orderService, 
        ICustomerService customerService, 
        IIncompleteOrderService incompleteOrderService,
        ILogger<OrdersController> logger, 
        IHubContext<OrderHub> hubContext)
    {
        _orderService = orderService;
        _customerService = customerService;
        _incompleteOrderService = incompleteOrderService;
        _logger = logger;
        _hubContext = hubContext;
    }

    [HttpPost]
    [EnableRateLimiting("fixed")]
    public async Task<ActionResult<OrderDto>> CreateOrder(OrderCreateDto orderDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var sessionId = Request.Headers["X-Session-Id"].ToString();
            var order = await _orderService.CreateOrderAsync(orderDto, sessionId);

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

    [HttpPost("incomplete-autosave")]
    [EnableRateLimiting("fixed")]
    public async Task<ActionResult<OrderDto>> AutosaveIncompleteOrder(IncompleteOrderAutosaveDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = Request.Headers["User-Agent"].ToString();
            var result = await _incompleteOrderService.AutosaveIncompleteOrderAsync(dto, ipAddress, userAgent);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to autosave incomplete order for session {SessionId}", dto.SessionId);
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

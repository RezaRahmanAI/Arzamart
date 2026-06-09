using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly IOrderService _orderService;

    public CustomersController(ICustomerService customerService, IOrderService orderService)
    {
        _customerService = customerService;
        _orderService = orderService;
    }

    [HttpGet("lookup")]
    public async Task<ActionResult<CustomerDto>> Lookup(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return BadRequest(new { error = "Phone number is required" });
        }

        var customer = await _customerService.GetCustomerByPhoneAsync(phone);

        if (customer == null)
        {
            return Ok(null); // Return success with null object to avoid 404 errors in frontend
        }

        return Ok(new CustomerDto
        {
            Id = customer.Id,
            Phone = customer.Phone,
            Name = customer.Name,
            Address = customer.Address,
            City = customer.City,
            Area = customer.Area,
            CreatedAt = customer.CreatedAt
        });
    }

    [HttpPost("profile")]
    public async Task<ActionResult<CustomerDto>> UpdateProfile(CustomerProfileRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var customer = await _customerService.CreateOrUpdateCustomerAsync(
            request.Phone, 
            request.Name, 
            request.Address,
            request.City,
            request.Area
        );

        return Ok(new CustomerDto
        {
            Id = customer.Id,
            Phone = customer.Phone,
            Name = customer.Name,
            Address = customer.Address,
            City = customer.City,
            Area = customer.Area,
            CreatedAt = customer.CreatedAt
        });
    }

    [HttpGet("orders")]
    public async Task<ActionResult<List<OrderDto>>> GetOrders(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return BadRequest(new { error = "Phone number is required" });
        }

        var customerOrders = await _orderService.GetOrdersByPhoneAsync(phone);
        
        return Ok(customerOrders);
    }
}

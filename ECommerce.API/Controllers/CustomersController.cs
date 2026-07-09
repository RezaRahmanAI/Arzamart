using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
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

    private bool IsAuthorizedForCustomer(Customer customer)
    {
        if (User.IsInRole("Admin") || User.IsInRole("SuperAdmin") || User.IsInRole("Staff"))
        {
            return true;
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            if (userId == customer.UserId || userId == customer.Id.ToString())
            {
                return true;
            }
        }

        var phoneClaim = User.FindFirst(System.Security.Claims.ClaimTypes.MobilePhone)?.Value;
        if (!string.IsNullOrEmpty(phoneClaim) && phoneClaim == customer.Phone)
        {
            return true;
        }

        return false;
    }

    [HttpGet("lookup")]
    [Authorize]
    public async Task<ActionResult<CustomerDto>> Lookup(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return BadRequest(new { error = "Phone number is required" });
        }

        var customer = await _customerService.GetCustomerByPhoneAsync(phone);

        if (customer == null)
        {
            return Ok(null);
        }

        if (!IsAuthorizedForCustomer(customer))
        {
            return Forbid();
        }

        return Ok(new CustomerDto
        {
            Id = customer.Id,
            Phone = customer.Phone,
            Name = customer.Name,
            Address = customer.Address,
            City = customer.City,
            Area = customer.Area,
            CreatedAt = customer.CreatedAt,
            DivisionId = customer.DivisionId,
            DivisionName = customer.Division?.NameEn,
            DistrictId = customer.DistrictId,
            DistrictName = customer.District?.NameEn,
            UpazilaId = customer.UpazilaId,
            UpazilaName = customer.Upazila?.NameEn
        });
    }

    [HttpPost("profile")]
    [Authorize]
    public async Task<ActionResult<CustomerDto>> UpdateProfile(CustomerProfileRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var customer = await _customerService.GetCustomerByPhoneAsync(request.Phone);
        if (customer != null && !IsAuthorizedForCustomer(customer))
        {
            return Forbid();
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var updatedCustomer = await _customerService.CreateOrUpdateCustomerAsync(
            request.Phone, 
            request.Name, 
            request.Address,
            request.City,
            request.Area,
            userId,
            request.DivisionId,
            request.DistrictId,
            request.UpazilaId
        );

        if (updatedCustomer == null)
        {
            return BadRequest(new { error = "Failed to update profile" });
        }

        return Ok(new CustomerDto
        {
            Id = updatedCustomer.Id,
            Phone = updatedCustomer.Phone,
            Name = updatedCustomer.Name,
            Address = updatedCustomer.Address,
            City = updatedCustomer.City,
            Area = updatedCustomer.Area,
            CreatedAt = updatedCustomer.CreatedAt,
            DivisionId = updatedCustomer.DivisionId,
            DivisionName = updatedCustomer.Division?.NameEn,
            DistrictId = updatedCustomer.DistrictId,
            DistrictName = updatedCustomer.District?.NameEn,
            UpazilaId = updatedCustomer.UpazilaId,
            UpazilaName = updatedCustomer.Upazila?.NameEn
        });
    }

    [HttpGet("orders")]
    [Authorize]
    public async Task<ActionResult<List<OrderDto>>> GetOrders(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return BadRequest(new { error = "Phone number is required" });
        }

        var customer = await _customerService.GetCustomerByPhoneAsync(phone);
        if (customer == null)
        {
            return Ok(new List<OrderDto>());
        }

        if (!IsAuthorizedForCustomer(customer))
        {
            return Forbid();
        }

        var customerOrders = await _orderService.GetOrdersByPhoneAsync(phone);
        
        return Ok(customerOrders);
    }
}

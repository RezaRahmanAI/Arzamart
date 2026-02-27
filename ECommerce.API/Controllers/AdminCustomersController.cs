using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/customers")]
[Authorize(Roles = "Admin")]
public class AdminCustomersController : ControllerBase
{
    private readonly CustomerService _customerService;

    public AdminCustomersController(CustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetCustomers(
        [FromQuery] string? searchTerm,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (items, total) = await _customerService.GetCustomersAsync(searchTerm, page, pageSize);

        return Ok(new
        {
            items = items.Select(c => new
            {
                c.Id,
                c.Name,
                c.Phone,
                c.Address,
                c.CreatedAt,
                c.UpdatedAt
            }),
            total
        });
    }
    [HttpPost("{id}/flag")]
    public async Task<IActionResult> FlagCustomer(int id)
    {
        var customer = await _customerService.GetCustomerByIdAsync(id);
        if (customer == null) return NotFound();

        customer.IsSuspicious = true;
        await _customerService.UpdateCustomerAsync(customer);

        return Ok();
    }

    [HttpPost("{id}/unflag")]
    public async Task<IActionResult> UnflagCustomer(int id)
    {
        var customer = await _customerService.GetCustomerByIdAsync(id);
        if (customer == null) return NotFound();

        customer.IsSuspicious = false;
        await _customerService.UpdateCustomerAsync(customer);

        return Ok();
    }
}

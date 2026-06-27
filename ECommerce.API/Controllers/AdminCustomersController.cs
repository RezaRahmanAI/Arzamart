using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Admin;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/customers")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("customers")]
public class AdminCustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public AdminCustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponseDto<AdminCustomerListItemDto>>> GetCustomers(
        [FromQuery] string? searchTerm,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (items, total) = await _customerService.GetCustomersAsync(searchTerm, page, pageSize);

        return Ok(new PagedResponseDto<AdminCustomerListItemDto>
        {
            Items = items.Select(c => new AdminCustomerListItemDto
            {
                Id = c.Id,
                Name = c.Name,
                Phone = c.Phone,
                Address = c.Address,
                IsSuspicious = c.IsSuspicious,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList(),
            Total = total
        });
    }
    [HttpPost("{id}/flag")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> FlagCustomer(int id)
    {
        try
        {
            await _customerService.FlagCustomerAsync(id, true);
            return Ok();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/unflag")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> UnflagCustomer(int id)
    {
        try
        {
            await _customerService.FlagCustomerAsync(id, false);
            return Ok();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}


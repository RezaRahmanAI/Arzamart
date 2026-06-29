using ECommerce.API.Helpers;
using ECommerce.API.Services;
using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Admin;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ECommerce.API.Controllers;

[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[StaffMenuAccess("users")]
[Route("api/admin/users")]
[ApiController]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _adminUserService;

    public AdminUsersController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private string? GetClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminUserItemDto>>> GetAdminUsers()
    {
        return Ok(await _adminUserService.GetAllAsync());
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> CreateAdminUser([FromBody] CreateAdminUserDto dto)
    {
        var (success, message, user) = await _adminUserService.CreateAsync(dto, GetCurrentUserId()!, GetClientIp());
        if (!success) return BadRequest(new { message });
        return Ok(new { message, user });
    }

    [HttpPost("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> UpdateAdminUser(string id, [FromBody] UpdateAdminUserDto dto)
    {
        var (success, message) = await _adminUserService.UpdateAsync(id, dto, GetCurrentUserId()!, GetClientIp());
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> ResetAdminUserPassword(string id, [FromBody] ResetPasswordDto dto)
    {
        var (success, message) = await _adminUserService.ResetPasswordAsync(id, dto, GetCurrentUserId()!, GetClientIp());
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    [HttpPost("{id}/toggle-active")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> ToggleUserActive(string id)
    {
        var (success, result) = await _adminUserService.ToggleActiveAsync(id, GetCurrentUserId()!);
        if (!success) return BadRequest(new { message = result.Message });
        return Ok(result);
    }

    [HttpGet("{id}/activity-log")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> GetActivityLog(string id)
    {
        return Ok(await _adminUserService.GetActivityLogAsync(id));
    }
}

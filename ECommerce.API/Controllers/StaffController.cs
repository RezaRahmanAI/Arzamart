using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using ECommerce.Core.DTOs.Staff;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize(Roles = "SuperAdmin")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private string? GetClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();

    // ──────────────────────── Staff Users ────────────────────────

    [HttpGet("users")]
    public async Task<ActionResult<StaffUserListResultDto>> GetStaffUsers(
        [FromQuery] string? search,
        [FromQuery] string? roleId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Min(Math.Max(1, pageSize), 100);
        var result = await _staffService.GetStaffUsersAsync(search, roleId, isActive, page, pageSize);
        return Ok(result);
    }

    [HttpGet("users/{id}")]
    public async Task<ActionResult<StaffUserDto>> GetStaffUser(string id)
    {
        var user = await _staffService.GetStaffUserAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost("users")]
    public async Task<ActionResult> CreateStaff([FromBody] CreateStaffDto dto)
    {
        var (success, message, user) = await _staffService.CreateStaffAsync(dto, GetCurrentUserId()!, GetClientIp());
        if (!success) return BadRequest(new { message });
        return Ok(new { message, data = user });
    }

    [HttpPut("users/{id}")]
    public async Task<ActionResult> UpdateStaff(string id, [FromBody] UpdateStaffDto dto)
    {
        var (success, message) = await _staffService.UpdateStaffAsync(id, dto, GetCurrentUserId()!, GetClientIp());
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    [HttpPatch("users/{id}/status")]
    public async Task<ActionResult> ToggleStatus(string id, [FromBody] ToggleStatusDto dto)
    {
        var (success, message) = await _staffService.ToggleStaffStatusAsync(id, dto.IsActive, GetCurrentUserId()!);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    [HttpDelete("users/{id}")]
    public async Task<ActionResult> DeleteStaff(string id)
    {
        var (success, message) = await _staffService.DeleteStaffAsync(id, GetCurrentUserId()!, GetClientIp());
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    [HttpPost("users/{id}/reset-password")]
    public async Task<ActionResult> ResetPassword(string id, [FromBody] ResetPasswordStaffDto dto)
    {
        var (success, message) = await _staffService.ResetPasswordAsync(id, dto.Password, GetCurrentUserId()!, GetClientIp());
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    // ──────────────────────── Roles ────────────────────────

    [HttpGet("roles")]
    public async Task<ActionResult<List<StaffRoleDto>>> GetRoles()
    {
        return Ok(await _staffService.GetRolesAsync());
    }

    [HttpPost("roles")]
    public async Task<ActionResult> CreateRole([FromBody] CreateRoleDto dto)
    {
        var (success, message, id) = await _staffService.CreateRoleAsync(dto);
        if (!success) return BadRequest(new { message });
        return Ok(new { message, data = new { id } });
    }

    [HttpPut("roles/{id}")]
    public async Task<ActionResult> UpdateRole(string id, [FromBody] UpdateRoleDto dto)
    {
        var (success, message) = await _staffService.UpdateRoleAsync(id, dto);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    [HttpDelete("roles/{id}")]
    public async Task<ActionResult> DeleteRole(string id)
    {
        var (success, message) = await _staffService.DeleteRoleAsync(id);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    [HttpGet("roles/{roleId}/permissions")]
    public async Task<ActionResult<List<string>>> GetRolePermissions(string roleId)
    {
        return Ok(await _staffService.GetRolePermissionsAsync(roleId));
    }

    [HttpPut("roles/{roleId}/permissions")]
    public async Task<ActionResult> UpdateRolePermissions(string roleId, [FromBody] List<string> permissionIds)
    {
        var (success, message) = await _staffService.UpdateRolePermissionsAsync(roleId, permissionIds);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    // ──────────────────────── Modules ────────────────────────

    [HttpGet("modules")]
    public async Task<ActionResult<List<StaffModuleDto>>> GetModules()
    {
        return Ok(await _staffService.GetModulesAsync());
    }

    // ──────────────────────── Audit Logs ────────────────────────

    [HttpGet("audit-log")]
    public async Task<ActionResult<StaffAuditLogListResultDto>> GetAuditLogs(
        [FromQuery] string? actorId,
        [FromQuery] string? action,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        return Ok(await _staffService.GetAuditLogsAsync(actorId, action, startDate, endDate, page, pageSize));
    }
}

// Request DTOs specific to controller (not in Core to keep them API-layer)
public class ToggleStatusDto
{
    public bool IsActive { get; set; }
}

public class ResetPasswordStaffDto
{
    [Required]
    [MinLength(8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$", ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, and one digit")]
    public string Password { get; set; } = string.Empty;
}

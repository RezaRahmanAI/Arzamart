using ECommerce.API.Helpers;
using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Admin;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerce.API.Controllers;

[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[StaffMenuAccess("users")]
[Route("api/admin/users")]
[ApiController]
public class AdminUsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly PasswordProtector _passwordProtector;
    private readonly IActivityLogService _activityLogService;

    public AdminUsersController(UserManager<ApplicationUser> userManager, PasswordProtector passwordProtector, IActivityLogService activityLogService)
    {
        _userManager = userManager;
        _passwordProtector = passwordProtector;
        _activityLogService = activityLogService;
    }

    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private string? GetClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private async Task LogActivityAsync(string userId, string action, string? details = null)
    {
        await _activityLogService.LogAsync(userId, action, details, GetClientIp(), GetCurrentUserId());
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminUserItemDto>>> GetAdminUsers()
    {
        var users = await _userManager.Users
            .Where(u => u.Role == "Admin" || u.Role == "SuperAdmin" || u.Role == "Staff")
            .Select(u => new AdminUserItemDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                UserName = u.UserName,
                Phone = u.Phone,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                AllowedMenus = u.AllowedMenusJson != null
                    ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(u.AllowedMenusJson, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()
                    : new List<string>()
            })
            .OrderByDescending(u => u.Role == "SuperAdmin" ? 3 : u.Role == "Admin" ? 2 : 1)
            .ThenBy(u => u.FullName)
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> CreateAdminUser([FromBody] CreateAdminUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Username and password are required" });

        if (dto.Password.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters" });

        var existingByUsername = await _userManager.FindByNameAsync(dto.UserName);
        if (existingByUsername != null)
            return BadRequest(new { message = "User already exists with this username" });

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var existingByEmail = await _userManager.FindByEmailAsync(dto.Email);
            if (existingByEmail != null)
                return BadRequest(new { message = "User already exists with this email" });
        }

        var role = string.IsNullOrWhiteSpace(dto.Role) ? "Staff" : dto.Role;
        if (role != "Admin" && role != "Staff" && role != "SuperAdmin")
            return BadRequest(new { message = "Invalid role. Only Admin, Staff, and SuperAdmin roles can be created." });

        var encryptedPassword = _passwordProtector.Encrypt(dto.Password);

        var user = new ApplicationUser
        {
            UserName = dto.UserName,
            Email = dto.Email,
            FullName = dto.FullName,
            Phone = dto.Phone,
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            EmailConfirmed = !string.IsNullOrWhiteSpace(dto.Email),
            AllowedMenus = role == "Staff" ? (dto.AllowedMenus ?? new List<string>()) : new List<string>(),
            PasswordEncrypted = encryptedPassword,
            ForceChangePassword = true
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

        await _userManager.AddToRoleAsync(user, role);
        await LogActivityAsync(user.Id, "AccountCreated", $"Account created with role: {role}");

        return Ok(new
        {
            message = "Staff account created successfully",
            user = new AdminUserItemDto
            {
                Id = user.Id,
                UserName = user.UserName,
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                AllowedMenus = user.AllowedMenus
            }
        });
    }

    [HttpPost("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> UpdateAdminUser(string id, [FromBody] UpdateAdminUserDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        var changes = new List<string>();

        if (!string.IsNullOrWhiteSpace(dto.UserName) && dto.UserName != user.UserName)
        {
            var existing = await _userManager.FindByNameAsync(dto.UserName);
            if (existing != null && existing.Id != user.Id)
                return BadRequest(new { message = "Username already taken" });
            changes.Add($"Username: {user.UserName} → {dto.UserName}");
            user.UserName = dto.UserName;
        }

        if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
        {
            var existing = await _userManager.FindByEmailAsync(dto.Email);
            if (existing != null && existing.Id != user.Id)
                return BadRequest(new { message = "Email already taken" });
            changes.Add($"Email updated");
            user.Email = dto.Email;
        }

        if (!string.IsNullOrWhiteSpace(dto.Role) && dto.Role != user.Role)
        {
            if (dto.Role != "Admin" && dto.Role != "Staff" && dto.Role != "SuperAdmin")
                return BadRequest(new { message = "Invalid role. Only Admin, Staff, and SuperAdmin roles are allowed." });

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, dto.Role);
            changes.Add($"Role: {user.Role} → {dto.Role}");
            user.Role = dto.Role;
        }

        if (dto.FullName != null && dto.FullName != user.FullName)
        {
            changes.Add($"Name updated");
            user.FullName = dto.FullName;
        }

        if (dto.Phone != null && dto.Phone != user.Phone)
        {
            user.Phone = dto.Phone;
        }

        if (user.Role == "Staff")
        {
            if (dto.AllowedMenus != null)
            {
                changes.Add($"Permissions updated");
                user.AllowedMenus = dto.AllowedMenus;
            }
        }
        else
        {
            user.AllowedMenus = new List<string>();
        }

        if (dto.ForceChangePassword.HasValue && dto.ForceChangePassword.Value != user.ForceChangePassword)
        {
            user.ForceChangePassword = dto.ForceChangePassword.Value;
            changes.Add($"ForceChangePassword: {(!dto.ForceChangePassword.Value ? "disabled" : "enabled")}");
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            if (dto.Password.Length < 6)
                return BadRequest(new { message = "Password must be at least 6 characters" });

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var passwordResult = await _userManager.ResetPasswordAsync(user, token, dto.Password);
            if (!passwordResult.Succeeded)
                return BadRequest(new { message = "Profile updated, but password reset failed: " + string.Join(", ", passwordResult.Errors.Select(e => e.Description)) });

            user.PasswordEncrypted = _passwordProtector.Encrypt(dto.Password);
            user.ForceChangePassword = true;
            await _userManager.UpdateAsync(user);
            changes.Add("Password changed");
        }

        if (changes.Count > 0)
            await LogActivityAsync(user.Id, "AccountUpdated", string.Join("; ", changes));

        return Ok(new { message = "User updated successfully" });
    }

    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> ResetAdminUserPassword(string id, [FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "New password is required" });

        if (dto.NewPassword.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters" });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

        user.PasswordEncrypted = _passwordProtector.Encrypt(dto.NewPassword);
        user.ForceChangePassword = true;
        await _userManager.UpdateAsync(user);

        await LogActivityAsync(user.Id, "PasswordReset", "Password was reset by SuperAdmin");

        return Ok(new { message = "Password reset successfully" });
    }

    [HttpGet("{id}/password")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> GetUserPassword(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        if (string.IsNullOrEmpty(user.PasswordEncrypted))
            return Ok(new { password = "", message = "No encrypted password stored. The user needs a password reset." });

        var decrypted = _passwordProtector.Decrypt(user.PasswordEncrypted);

        await LogActivityAsync(user.Id, "PasswordViewed", "Password was viewed by SuperAdmin");

        return Ok(new { password = decrypted });
    }

    [HttpPost("{id}/toggle-active")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> ToggleUserActive(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        var currentUserId = GetCurrentUserId();
        if (user.Id == currentUserId)
            return BadRequest(new { message = "You cannot deactivate your own account" });

        if (user.Role == "SuperAdmin")
            return BadRequest(new { message = "SuperAdmin accounts cannot be deactivated" });

        user.IsActive = !user.IsActive;
        await _userManager.UpdateAsync(user);

        await LogActivityAsync(user.Id, "StatusChanged", $"Account {(user.IsActive ? "activated" : "deactivated")}");

        return Ok(new UserStatusChangeResultDto { Message = $"User {(user.IsActive ? "activated" : "deactivated")} successfully", IsActive = user.IsActive });
    }

    [HttpGet("{id}/activity-log")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> GetActivityLog(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        var logs = await _activityLogService.GetRecentLogsAsync(id);
        var result = logs.Select(l => new AdminActivityLogEntryDto
        {
            Id = l.Id,
            Action = l.Action,
            Details = l.Details,
            IpAddress = l.IpAddress,
            CreatedAt = l.CreatedAt,
            PerformedByName = l.PerformedBy?.FullName
        }).ToList();

        return Ok(result);
    }
}

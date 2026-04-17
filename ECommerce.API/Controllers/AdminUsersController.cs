using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerce.API.Controllers;

[Authorize(Roles = "Admin,SuperAdmin")]
[Route("api/admin/users")]
[ApiController]
public class AdminUsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public AdminUsersController(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAdminUsers()
    {
        var users = await _userManager.Users
            .Where(u => u.Role == "Admin" || u.Role == "SuperAdmin")
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.Phone,
                u.Role,
                u.IsActive,
                u.CreatedAt
            })
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> CreateAdminUser([FromBody] CreateAdminUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Username and password are required" });
        }

        var existingByUsername = await _userManager.FindByNameAsync(dto.UserName);
        if (existingByUsername != null)
        {
            return BadRequest(new { message = "User already exists with this username" });
        }

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var existingByEmail = await _userManager.FindByEmailAsync(dto.Email);
            if (existingByEmail != null)
            {
                return BadRequest(new { message = "User already exists with this email" });
            }
        }

        var role = string.IsNullOrWhiteSpace(dto.Role) ? "Admin" : dto.Role;
        if (role != "Admin" && role != "SuperAdmin")
        {
            return BadRequest(new { message = "Invalid role assigned" });
        }

        var user = new ApplicationUser
        {
            UserName = dto.UserName,
            Email = dto.Email, // Can be null/empty for staff
            FullName = dto.FullName,
            Phone = dto.Phone,
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            EmailConfirmed = !string.IsNullOrWhiteSpace(dto.Email)
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
        }

        await _userManager.AddToRoleAsync(user, role);

        return Ok(new { message = "Admin user created successfully", user = new { user.Id, user.UserName, user.FullName, user.Role, user.IsActive } });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> UpdateAdminUser(string id, [FromBody] UpdateAdminUserDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.UserName) && dto.UserName != user.UserName)
        {
            var existing = await _userManager.FindByNameAsync(dto.UserName);
            if (existing != null && existing.Id != user.Id) return BadRequest(new { message = "Username already taken" });
            user.UserName = dto.UserName;
        }

        if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
        {
            var existing = await _userManager.FindByEmailAsync(dto.Email);
            if (existing != null && existing.Id != user.Id) return BadRequest(new { message = "Email already taken" });
            user.Email = dto.Email;
        }

        if (!string.IsNullOrWhiteSpace(dto.Role) && dto.Role != user.Role)
        {
            if (dto.Role != "Admin" && dto.Role != "SuperAdmin")
            {
                return BadRequest(new { message = "Invalid role assigned" });
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, dto.Role);
            user.Role = dto.Role;
        }

        user.FullName = dto.FullName ?? user.FullName;
        user.Phone = dto.Phone ?? user.Phone;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
        }

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var passwordResult = await _userManager.ResetPasswordAsync(user, token, dto.Password);
            if (!passwordResult.Succeeded)
            {
                return BadRequest(new { message = "Profile updated, but password reset failed: " + string.Join(", ", passwordResult.Errors.Select(e => e.Description)) });
            }
        }

        return Ok(new { message = "User updated successfully" });
    }

    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> ResetAdminUserPassword(string id, [FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            return BadRequest(new { message = "New password is required" });
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);

        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
        }

        return Ok(new { message = "Password reset successfully" });
    }

    [HttpPost("{id}/toggle-active")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> ToggleUserActive(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        // Prevent deactivating yourself
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (user.Id == currentUserId)
        {
            return BadRequest(new { message = "You cannot deactivate your own account" });
        }

        user.IsActive = !user.IsActive;
        await _userManager.UpdateAsync(user);

        return Ok(new { message = $"User {(user.IsActive ? "activated" : "deactivated")} successfully", isActive = user.IsActive });
    }
}

public class CreateAdminUserDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Role { get; set; }
}

public class UpdateAdminUserDto
{
    public string? FullName { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
    public string? Phone { get; set; }
    public string? Password { get; set; }
}

public class ResetPasswordDto
{
    public string NewPassword { get; set; } = string.Empty;
}

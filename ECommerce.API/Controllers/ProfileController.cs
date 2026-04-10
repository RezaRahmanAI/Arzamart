using ECommerce.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerce.API.Controllers;

[Authorize]
[Route("api/profile")]
[ApiController]
public class ProfileController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public ProfileController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            user.Id,
            user.UserName,
            user.Email,
            user.FullName,
            user.Phone,
            Role = roles.FirstOrDefault() ?? user.Role
        });
    }

    [HttpPut]
    public async Task<ActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return NotFound();

        // Security Check: If SuperAdmin is changing email, require password
        var roles = await _userManager.GetRolesAsync(user);
        var isSuperAdmin = roles.Contains("SuperAdmin");

        if (isSuperAdmin && !string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
        {
            if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
            {
                return BadRequest(new { message = "Current password is required to change SuperAdmin email" });
            }

            var passwordCheck = await _userManager.CheckPasswordAsync(user, dto.CurrentPassword);
            if (!passwordCheck)
            {
                return BadRequest(new { message = "Invalid current password" });
            }
        }

        // Update fields
        user.FullName = dto.FullName ?? user.FullName;
        user.Phone = dto.Phone ?? user.Phone;

        if (!string.IsNullOrWhiteSpace(dto.UserName) && dto.UserName != user.UserName)
        {
            var existing = await _userManager.FindByNameAsync(dto.UserName);
            if (existing != null && existing.Id != user.Id)
                return BadRequest(new { message = "Username already taken" });
            
            user.UserName = dto.UserName;
        }

        if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
        {
            var existing = await _userManager.FindByEmailAsync(dto.Email);
            if (existing != null && existing.Id != user.Id)
                return BadRequest(new { message = "Email already taken" });
            
            user.Email = dto.Email;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
        }

        return Ok(new { message = "Profile updated successfully" });
    }

    [HttpPost("change-password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            return BadRequest(new { message = "Current and new passwords are required" });
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return NotFound();

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
        }

        return Ok(new { message = "Password changed successfully" });
    }
}

public class UpdateProfileDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? UserName { get; set; }
    public string? Phone { get; set; }
    public string? CurrentPassword { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

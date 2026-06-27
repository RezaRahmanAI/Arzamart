using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerce.API.Controllers;

[Authorize]
[Route("api/profile")]
[ApiController]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    public async Task<ActionResult<ProfileResponseDto>> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var profile = await _profileService.GetProfileAsync(userId!);
        if (profile == null) return NotFound();
        return Ok(profile);
    }

    [HttpPut]
    public async Task<ActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var (success, error) = await _profileService.UpdateProfileAsync(userId!, dto);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "Profile updated successfully" });
    }

    [HttpPost("change-password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "Current and new passwords are required" });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var (success, errors) = await _profileService.ChangePasswordAsync(userId!, dto.CurrentPassword, dto.NewPassword);
        if (!success) return BadRequest(new { message = string.Join(", ", errors) });
        return Ok(new { message = "Password changed successfully" });
    }
}

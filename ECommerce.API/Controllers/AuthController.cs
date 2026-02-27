using ECommerce.Core.DTOs;
using Microsoft.Extensions.Caching.Memory;

using ECommerce.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ECommerce.Core.Interfaces.IAuthService _authService;
    private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache _cache;

    public AuthController(ECommerce.Core.Interfaces.IAuthService authService, Microsoft.Extensions.Caching.Memory.IMemoryCache cache)
    {
        _authService = authService;
        _cache = cache;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login(LoginDto loginDto)
    {
        try
        {
            var deviceInfo = Request.Headers["User-Agent"].ToString();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            var result = await _authService.LoginAsync(loginDto, deviceInfo, ipAddress);

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Always true for professional setup
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            Response.Cookies.Append("refreshToken", result.RefreshToken, cookieOptions);
            
            return Ok(result.Response);
        }
        catch (Exception ex) when (ex.Message == "INVALID_CREDENTIALS")
        {
            return Unauthorized(new { error = "INVALID_CREDENTIALS", message = "Invalid email or password" });
        }
    }

    [HttpPost("customer/login")]
    public async Task<ActionResult<LoginResponseDto>> CustomerLogin([FromBody] CustomerLoginDto dto)
    {
        try
        {
            var deviceInfo = Request.Headers["User-Agent"].ToString();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            var result = await _authService.CustomerLoginAsync(dto.Phone, deviceInfo, ipAddress);

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            Response.Cookies.Append("refreshToken", result.RefreshToken, cookieOptions);
            
            return Ok(result.Response);
        }
        catch (Exception ex) when (ex.Message == "USER_NOT_FOUND")
        {
            return NotFound(new { error = "USER_NOT_FOUND", message = "Phone number not registered" });
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        var expiredAccessToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

        if (string.IsNullOrEmpty(refreshToken)) return NoContent();

        try
        {
            var deviceInfo = Request.Headers["User-Agent"].ToString();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            var result = await _authService.RefreshTokenAsync(refreshToken, expiredAccessToken, deviceInfo, ipAddress);
            
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            Response.Cookies.Append("refreshToken", result.RefreshToken, cookieOptions);

            return Ok(result.Response);
        }
        catch (Exception)
        {
            // Return 204 instead of 401 to prevent browser console red errors on startup
            // when a user has a token but it's expired/invalid and they just need to be logged out.
            return NoContent();
        }
    }

    [HttpPost("logout")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var jti = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value;

        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.RevokeTokenAsync(refreshToken);
        }

        if (!string.IsNullOrEmpty(jti))
        {
            // Revoke JTI in cache
            _cache.Set($"revoked_jti:{jti}", true, TimeSpan.FromMinutes(15));
        }

        Response.Cookies.Delete("refreshToken");

        return Ok(new { message = "Logged out successfully" });
    }
}

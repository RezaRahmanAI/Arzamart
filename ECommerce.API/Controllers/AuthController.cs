using System.Security.Claims;
using ECommerce.API.Contracts.Auth;
using ECommerce.Core.DTOs.Auth;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        IMemoryCache cache,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _cache = cache;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AdminAuthResponseDto>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Identifier) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Identifier and password are required.");

        try
        {
            var (response, _) = await _authService.AdminLoginAsync(
                request.Identifier,
                request.Password,
                HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");

            return Ok(response);
        }
        catch (Exception ex)
        {
            return ex.Message switch
            {
                "INVALID_CREDENTIALS" => Unauthorized("Invalid credentials."),
                "ACCOUNT_DEACTIVATED" => Unauthorized("Account is deactivated."),
                _ => StatusCode(500, "An error occurred.")
            };
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return BadRequest("Refresh token is required.");

        try
        {
            var (response, newRefreshToken) = await _authService.RefreshAdminTokenAsync(
                request.RefreshToken,
                HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Refresh token validation failed");
            return Unauthorized("Session expired or invalid refresh token.");
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult> Me(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var cacheKey = $"auth_me:{userId}";
        if (_cache.TryGetValue(cacheKey, out UserSummaryDto cached))
            return Ok(cached);

        var userSummary = await _authService.GetUserSummaryAsync(userId);
        if (userSummary == null) return Unauthorized();

        _cache.Set(cacheKey, userSummary, TimeSpan.FromMinutes(5));
        return Ok(userSummary);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            _cache.Remove($"auth_me:{userId}");
            await _authService.AdminLogoutAsync(userId);
        }
        return Ok(new { message = "Logged out successfully" });
    }

    [HttpPost("customer-login")]
    public async Task<ActionResult> CustomerLogin([FromBody] CustomerLoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest("Phone number is required.");

        try
        {
            var (response, _) = await _authService.CustomerLoginAsync(
                request.Phone,
                "customer-web",
                HttpContext.Connection.RemoteIpAddress?.ToString() ?? "");

            return Ok(response);
        }
        catch (InvalidOperationException ex) when (ex.Message == "ACCOUNT_DEACTIVATED")
        {
            return Unauthorized("Account is deactivated.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}

public record RefreshRequest(string RefreshToken);

public record CustomerLoginRequest(string Phone);

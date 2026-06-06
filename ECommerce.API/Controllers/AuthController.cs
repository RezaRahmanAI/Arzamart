using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ECommerce.API.Contracts.Auth;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using ECommerce.API.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly PasswordProtector _passwordProtector;

    public AuthController(IConfiguration configuration, UserManager<ApplicationUser> userManager, ApplicationDbContext context, PasswordProtector passwordProtector)
    {
        _configuration = configuration;
        _userManager = userManager;
        _context = context;
        _passwordProtector = passwordProtector;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Identifier) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Identifier and password are required.");
        }

        var normalized = request.Identifier.Trim();
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Email == normalized || u.UserName == normalized, cancellationToken);

        if (user is null)
        {
            return Unauthorized("Invalid credentials.");
        }

        if (!user.IsActive)
        {
            return Unauthorized("Account is deactivated.");
        }

        var result = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!result)
        {
            return Unauthorized("Invalid credentials.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Any() && !string.IsNullOrEmpty(user.Role))
        {
            roles = new List<string> { user.Role };
        }
        if (!roles.Any())
        {
            roles = new List<string> { "Customer" };
        }

        var primaryRole = roles.Contains("SuperAdmin") ? "SuperAdmin" : (roles.FirstOrDefault() ?? "Customer");
        var isSuperAdmin = primaryRole == "SuperAdmin";

        var accessToken = GenerateAccessToken(user, roles, isSuperAdmin);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        if (primaryRole == "SuperAdmin" || primaryRole == "Admin" || primaryRole == "Staff")
        {
            var loginLog = new AdminActivityLog
            {
                UserId = user.Id,
                Action = "Login",
                Details = $"Logged in as {primaryRole}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                PerformedByUserId = user.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.AdminActivityLogs.Add(loginLog);
            await _context.SaveChangesAsync();
        }

        var userSummary = ToSummary(user, primaryRole);
        var response = new AuthResponse(accessToken, userSummary);
        
        return Ok(new { 
            token = accessToken, 
            refreshToken = refreshToken,
            user = userSummary,
            forceChangePassword = user.ForceChangePassword
        });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest("Refresh token is required.");
        }

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken, cancellationToken);

        if (user == null || !user.IsActive || user.RefreshTokenExpiry == null || user.RefreshTokenExpiry.Value < DateTime.UtcNow)
        {
            return Unauthorized("Session expired or invalid refresh token.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Any() && !string.IsNullOrEmpty(user.Role))
        {
            roles = new List<string> { user.Role };
        }
        if (!roles.Any())
        {
            roles = new List<string> { "Customer" };
        }

        var primaryRole = roles.Contains("SuperAdmin") ? "SuperAdmin" : (roles.FirstOrDefault() ?? "Customer");
        var isSuperAdmin = primaryRole == "SuperAdmin";

        var newAccessToken = GenerateAccessToken(user, roles, isSuperAdmin);
        var newRefreshToken = GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        var userSummary = ToSummary(user, primaryRole);
        return Ok(new { 
            token = newAccessToken, 
            refreshToken = newRefreshToken,
            user = userSummary,
            forceChangePassword = user.ForceChangePassword
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult> Me(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.Contains("SuperAdmin") ? "SuperAdmin" : (roles.FirstOrDefault() ?? user.Role ?? "Customer");

        return Ok(ToSummary(user, role));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;
                await _userManager.UpdateAsync(user);
            }
        }
        return Ok(new { message = "Logged out successfully" });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
        }

        user.ForceChangePassword = false;
        user.PasswordEncrypted = _passwordProtector.Encrypt(request.NewPassword);
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "Password changed successfully" });
    }

    private string GenerateAccessToken(ApplicationUser user, IList<string> roles, bool isSuperAdmin)
    {
        var key = _configuration["Token:Key"] ?? "development_key_arzamart_123456789";
        var issuer = _configuration["Token:Issuer"] ?? "https://api.arzamart.com";
        var audience = _configuration["Token:Audience"] ?? "https://arzamart.com";
        var keyBytes = Encoding.UTF8.GetBytes(key);
        if (keyBytes.Length < 32)
        {
            using var sha256 = SHA256.Create();
            keyBytes = sha256.ComputeHash(keyBytes);
        }
        var securityKey = new SymmetricSecurityKey(keyBytes);
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var email = user.Email ?? string.Empty;
        var displayName = user.FullName ?? user.UserName ?? email;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, displayName),
            new("is_super_admin", isSuperAdmin.ToString().ToLower()),
            new("force_change_password", user.ForceChangePassword.ToString().ToLower())
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private static UserSummary ToSummary(ApplicationUser user, string role)
    {
        return new UserSummary(
            user.Id,
            user.FullName ?? user.UserName ?? "User",
            user.Email ?? string.Empty,
            role,
            user.Phone,
            user.UserName,
            user.AllowedMenus);
    }
}

public record RefreshRequest(string RefreshToken);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
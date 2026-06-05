using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/staff/auth")]
public class StaffAuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public StaffAuthController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] StaffLoginRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { success = false, error = "BAD_REQUEST", message = "Username and password are required." });
        }

        var user = await _context.StaffUsers
            .Include(u => u.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .ThenInclude(p => p.Module)
            .FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Username);

        if (user == null || !user.IsActive)
        {
            return Unauthorized(new { success = false, error = "INVALID_CREDENTIALS", message = "Invalid username or password, or account is inactive." });
        }

        // Verify hash
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            return Unauthorized(new { success = false, error = "INVALID_CREDENTIALS", message = "Invalid username or password." });
        }

        // Fetch permissions list
        var permissions = user.Role.RolePermissions
            .Select(rp => $"{rp.Permission.Module.Slug}:{rp.Permission.Action}")
            .ToList();

        // Generate tokens
        var tokenString = GenerateAccessToken(user, permissions);
        var refreshTokenString = GenerateRefreshToken();

        // Update user record with refresh token
        user.RefreshToken = refreshTokenString;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Log audit
        await LogAuditAsync(user.Id, "STAFF_LOGIN", user.Id, new { ipAddress = GetClientIp() });

        return Ok(new
        {
            success = true,
            data = new
            {
                accessToken = tokenString,
                refreshToken = refreshTokenString,
                user = new
                {
                    id = user.Id,
                    fullName = user.FullName,
                    username = user.Username,
                    email = user.Email,
                    role = user.Role.Name,
                    isSuperAdmin = user.Role.Name == "Super Admin",
                    forceChangePassword = user.ForceChangePassword,
                    permissions = permissions
                }
            },
            message = "Logged in successfully."
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] StaffRefreshRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new { success = false, error = "BAD_REQUEST", message = "Refresh token is required." });
        }

        var user = await _context.StaffUsers
            .Include(u => u.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .ThenInclude(p => p.Module)
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

        if (user == null || !user.IsActive || user.RefreshTokenExpiry == null || user.RefreshTokenExpiry.Value < DateTime.UtcNow)
        {
            return Unauthorized(new { success = false, error = "INVALID_REFRESH_TOKEN", message = "Session expired or invalid refresh token." });
        }

        // Fetch permissions list
        var permissions = user.Role.RolePermissions
            .Select(rp => $"{rp.Permission.Module.Slug}:{rp.Permission.Action}")
            .ToList();

        // Generate new tokens
        var tokenString = GenerateAccessToken(user, permissions);
        var refreshTokenString = GenerateRefreshToken();

        // Update refresh token
        user.RefreshToken = refreshTokenString;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                accessToken = tokenString,
                refreshToken = refreshTokenString
            },
            message = "Token refreshed successfully."
        });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var actorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(actorIdClaim, out var actorId))
        {
            var user = await _context.StaffUsers.FindAsync(actorId);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                await LogAuditAsync(user.Id, "STAFF_LOGOUT", user.Id, new { ipAddress = GetClientIp() });
            }
        }

        return Ok(new { success = true, message = "Logged out successfully." });
    }

    private string GenerateAccessToken(StaffUser user, List<string> permissions)
    {
        var jwtKey = _configuration["Token:Key"] ?? "development_key_arzamart_123456789";
        var issuer = _configuration["Token:Issuer"] ?? "https://api.arzamart.com";
        var audience = _configuration["Token:Audience"] ?? "https://arzamart.com";
        
        var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
        if (keyBytes.Length < 32)
        {
            using var sha256 = SHA256.Create();
            keyBytes = sha256.ComputeHash(keyBytes);
        }

        var securityKey = new SymmetricSecurityKey(keyBytes);
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var roleName = user.Role.Name;
        string authRole = roleName;
        if (roleName == "Super Admin")
        {
            authRole = "SuperAdmin";
        }
        else if (roleName == "Manager" || roleName == "Viewer")
        {
            authRole = "Staff";
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new("username", user.Username),
            new(ClaimTypes.Role, authRole),
            new("role_id", user.RoleId.ToString()),
            new("is_super_admin", (roleName == "Super Admin").ToString().ToLower())
        };

        if (authRole != roleName)
        {
            claims.Add(new Claim(ClaimTypes.Role, roleName));
        }

        foreach (var permission in permissions)
        {
            claims.Add(new Claim("permissions", permission));
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

    private async Task LogAuditAsync(Guid actorId, string action, Guid targetStaffId, object? details = null)
    {
        var log = new StaffAuditLog
        {
            Id = Guid.NewGuid(),
            ActorId = actorId,
            Action = action,
            TargetStaffId = targetStaffId,
            Details = details != null ? System.Text.Json.JsonSerializer.Serialize(details) : null,
            CreatedAt = DateTime.UtcNow
        };
        _context.StaffAuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    private string? GetClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();
}

public class StaffLoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class StaffRefreshRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

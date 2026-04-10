using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ECommerce.API.Contracts.Auth;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
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

    public AuthController(IConfiguration configuration, UserManager<ApplicationUser> userManager)
    {
        _configuration = configuration;
        _userManager = userManager;
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

        var result = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!result)
        {
            return Unauthorized("Invalid credentials.");
        }

        // Fetch all roles
        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Any() && !string.IsNullOrEmpty(user.Role))
        {
            roles = new List<string> { user.Role };
        }
        if (!roles.Any())
        {
            roles = new List<string> { "Customer" };
        }

        var token = GenerateToken(user, roles);
        var primaryRole = roles.Contains("SuperAdmin") ? "SuperAdmin" : (roles.FirstOrDefault() ?? "Customer");
        return Ok(new AuthResponse(token, ToSummary(user, primaryRole)));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserSummary>> Me(CancellationToken cancellationToken)
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
        var role = roles.FirstOrDefault() ?? user.Role ?? "Customer";

        return Ok(ToSummary(user, role));
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok();
    }

    private string GenerateToken(ApplicationUser user, IList<string> roles)
    {
        var key = _configuration["Token:Key"] ?? "development_key_arzamart_123456789";
        var issuer = _configuration["Token:Issuer"] ?? "Arza Mart";
        var audience = _configuration["Token:Audience"] ?? "Arza Mart Users";
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
            new(ClaimTypes.Name, displayName)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserSummary ToSummary(ApplicationUser user, string role)
    {
        return new UserSummary(
            user.Id,
            user.FullName ?? user.UserName ?? "User",
            user.Email ?? string.Empty,
            role,
            user.Phone);
    }
}


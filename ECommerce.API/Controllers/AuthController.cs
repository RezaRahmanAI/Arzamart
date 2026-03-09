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
    private readonly ApplicationDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<ApplicationUser> _passwordHasher;

    public AuthController(ApplicationDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _passwordHasher = new PasswordHasher<ApplicationUser>();
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Identifier) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Identifier and password are required.");
        }

        var normalized = request.Identifier.Trim();
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == normalized || u.UserName == normalized, cancellationToken);

        if (user is null)
        {
            return Unauthorized("Invalid credentials.");
        }

        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return Unauthorized("Invalid credentials.");
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            return Unauthorized("Invalid credentials.");
        }

        var token = GenerateToken(user);
        return Ok(new AuthResponse(token, ToSummary(user)));
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

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(ToSummary(user));
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok();
    }

    private string GenerateToken(ApplicationUser user)
    {
        var key = _configuration["Token:Key"] ?? "development_key_arzamart_123456789";
        var issuer = _configuration["Token:Issuer"] ?? "ArzaMart";
        var audience = _configuration["Token:Audience"] ?? "ArzaMartUsers";
        var keyBytes = Encoding.UTF8.GetBytes(key);
        if (keyBytes.Length < 32)
        {
            using var sha256 = SHA256.Create();
            keyBytes = sha256.ComputeHash(keyBytes);
        }
        var securityKey = new SymmetricSecurityKey(keyBytes);
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var email = user.Email ?? string.Empty;
        var role = string.IsNullOrWhiteSpace(user.Role) ? "Customer" : user.Role;
        var displayName = user.FullName ?? user.UserName ?? email;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, displayName),
            new(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserSummary ToSummary(ApplicationUser user)
    {
        return new UserSummary(
            user.Id,
            user.FullName ?? user.UserName ?? "User",
            user.Email ?? string.Empty,
            user.Role,
            user.Phone);
    }
}


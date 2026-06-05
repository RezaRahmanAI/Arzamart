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
    private readonly ApplicationDbContext _context;

    public AuthController(IConfiguration configuration, UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _configuration = configuration;
        _userManager = userManager;
        _context = context;
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

        // Log admin/staff login activity
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
            // Try searching in StaffUser
            if (Guid.TryParse(userId, out var staffUserId))
            {
                var staffUser = await _context.StaffUsers
                    .Include(u => u.Role)
                    .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                    .ThenInclude(p => p.Module)
                    .FirstOrDefaultAsync(u => u.Id == staffUserId, cancellationToken);

                if (staffUser != null)
                {
                    // Map permissions to allowed menus
                    var allowedMenus = new List<string>();
                    var roleName = staffUser.Role.Name;
                    
                    if (roleName == "Super Admin")
                    {
                        allowedMenus.AddRange(new[] { "dashboard", "products", "orders", "customers", "analytics", "settings", "banners", "navigation", "pages", "reviews", "order-sources", "security", "users" });
                    }
                    else
                    {
                        var permissions = staffUser.Role.RolePermissions
                            .Select(rp => $"{rp.Permission.Module.Slug}:{rp.Permission.Action}")
                            .ToList();
                            
                        if (permissions.Any(p => p.StartsWith("inventory:"))) allowedMenus.Add("products");
                        if (permissions.Any(p => p.StartsWith("sales:")))
                        {
                            allowedMenus.Add("orders");
                            allowedMenus.Add("banners");
                            allowedMenus.Add("reviews");
                        }
                        if (permissions.Any(p => p.StartsWith("hr:"))) allowedMenus.Add("customers");
                        if (permissions.Any(p => p.StartsWith("reports:"))) allowedMenus.Add("analytics");
                        if (permissions.Any(p => p.StartsWith("settings:")))
                        {
                            allowedMenus.Add("settings");
                            allowedMenus.Add("navigation");
                            allowedMenus.Add("pages");
                            allowedMenus.Add("order-sources");
                            allowedMenus.Add("security");
                        }
                        if (permissions.Any(p => p.StartsWith("staff-management:"))) allowedMenus.Add("users");
                    }

                    var summary = new UserSummary(
                        staffUser.Id.ToString(),
                        staffUser.FullName,
                        staffUser.Email,
                        roleName,
                        null,
                        staffUser.Username,
                        allowedMenus
                    );

                    return Ok(summary);
                }
            }

            return Unauthorized();
        }

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.Contains("SuperAdmin") ? "SuperAdmin" : (roles.FirstOrDefault() ?? user.Role ?? "Customer");

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
            user.Phone,
            user.UserName,
            user.AllowedMenus);
    }
}


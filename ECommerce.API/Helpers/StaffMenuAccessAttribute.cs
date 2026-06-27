using ECommerce.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;
using System.Linq;
using System.Security.Claims;

namespace ECommerce.API.Helpers;

public class StaffMenuAccessAttribute : TypeFilterAttribute
{
    public StaffMenuAccessAttribute(string menuKey) : base(typeof(StaffMenuAccessFilter))
    {
        Arguments = new object[] { menuKey };
    }
}

public class StaffMenuAccessFilter : IAsyncAuthorizationFilter
{
    private readonly string _menuKey;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMemoryCache _cache;

    public StaffMenuAccessFilter(string menuKey, UserManager<ApplicationUser> userManager, IMemoryCache cache)
    {
        _menuKey = menuKey;
        _userManager = userManager;
        _cache = cache;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var userPrincipal = context.HttpContext.User;
        if (!userPrincipal.Identity?.IsAuthenticated ?? true)
        {
            return; // Handled by standard [Authorize]
        }

        // If the user is SuperAdmin or Admin, they have full access.
        if (userPrincipal.IsInRole("SuperAdmin") || userPrincipal.IsInRole("Admin") || userPrincipal.IsInRole("Super Admin"))
        {
            return;
        }

        // Check if there are permissions in the token claims
        var permissions = userPrincipal.FindAll("permissions").Select(c => c.Value).ToList();
        if (permissions.Any())
        {
            // If the user has a "is_super_admin" claim set to "true"
            var isSuperAdminClaim = userPrincipal.FindFirst("is_super_admin")?.Value;
            if (isSuperAdminClaim == "true" || isSuperAdminClaim == "True")
            {
                return; // Access granted
            }

            // Dashboard is allowed for all authenticated staff
            if (_menuKey.Equals("dashboard", System.StringComparison.OrdinalIgnoreCase))
            {
                return; // Access granted
            }

            // Map _menuKey to the permission prefix
            string prefix = _menuKey.ToLower() switch
            {
                "products" => "inventory:",
                "orders" => "sales:",
                "banners" => "sales:",
                "reviews" => "sales:",
                "customers" => "hr:",
                "analytics" => "reports:",
                "settings" => "settings:",
                "navigation" => "settings:",
                "pages" => "settings:",
                "order-sources" => "settings:",
                "security" => "settings:",
                "users" => "staff-management:",
                _ => _menuKey.ToLower() + ":"
            };

            if (permissions.Any(p => p.StartsWith(prefix, System.StringComparison.OrdinalIgnoreCase)))
            {
                return; // Access granted
            }
        }

        // If they are Staff, check their AllowedMenus (fallback for legacy ApplicationUser)
        if (userPrincipal.IsInRole("Staff"))
        {
            var userId = userPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId != null)
            {
                var cacheKey = $"staff_allowed_menus:{userId}";
                if (!_cache.TryGetValue(cacheKey, out List<string> allowedMenus))
                {
                    var user = await _userManager.FindByIdAsync(userId);
                    allowedMenus = user?.AllowedMenus ?? new List<string>();
                    _cache.Set(cacheKey, allowedMenus, TimeSpan.FromMinutes(5));
                }

                if (allowedMenus.Contains(_menuKey))
                {
                    return; // Access granted
                }
            }
        }

        // Default to Forbidden if they are not Admin/SuperAdmin and (not Staff OR lack the menu)
        context.Result = new ForbidResult();
    }
}

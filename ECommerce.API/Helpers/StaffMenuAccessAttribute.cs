using ECommerce.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
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

    public StaffMenuAccessFilter(string menuKey, UserManager<ApplicationUser> userManager)
    {
        _menuKey = menuKey;
        _userManager = userManager;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var userPrincipal = context.HttpContext.User;
        if (!userPrincipal.Identity?.IsAuthenticated ?? true)
        {
            return; // Handled by standard [Authorize]
        }

        // If the user is SuperAdmin or Admin, they have full access.
        if (userPrincipal.IsInRole("SuperAdmin") || userPrincipal.IsInRole("Admin"))
        {
            return;
        }

        // If they are Staff, check their AllowedMenus
        if (userPrincipal.IsInRole("Staff"))
        {
            var userId = userPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId != null)
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    if (user.AllowedMenus.Contains(_menuKey))
                    {
                        return; // Access granted
                    }
                }
            }
        }

        // Default to Forbidden if they are not Admin/SuperAdmin and (not Staff OR lack the menu)
        context.Result = new ForbidResult();
    }
}

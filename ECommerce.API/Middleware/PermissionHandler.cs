using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace ECommerce.API.Middleware;

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        // Check if user is Super Admin
        var isSuperAdminClaim = context.User.FindFirst("is_super_admin")?.Value;
        if (isSuperAdminClaim == "true" || isSuperAdminClaim == "True")
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Check user permissions
        var permissions = context.User.FindAll("permissions").Select(c => c.Value).ToList();
        
        // Match wildcard or exact permission
        // e.g. "sales:*" matches "sales:view"
        var reqParts = requirement.Permission.Split(':');
        if (reqParts.Length == 2)
        {
            var module = reqParts[0];

            if (permissions.Contains(requirement.Permission) || 
                permissions.Contains($"{module}:*") ||
                permissions.Contains("*:*"))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }
        }
        else
        {
            if (permissions.Contains(requirement.Permission))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }
        }

        // No matching permission found — fail the requirement
        context.Fail();
        return Task.CompletedTask;
    }
}

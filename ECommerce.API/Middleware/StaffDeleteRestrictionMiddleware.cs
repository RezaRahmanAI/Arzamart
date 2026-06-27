using System.Security.Claims;

namespace ECommerce.API.Middleware;

public class StaffDeleteRestrictionMiddleware
{
    private readonly RequestDelegate _next;

    private static readonly HashSet<string> BlockedEndpoints = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/admin/users",
        "/api/admin/roles",
        "/api/admin/settings"
    };

    public StaffDeleteRestrictionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Method == HttpMethods.Delete
            && context.User.Identity?.IsAuthenticated == true
            && context.User.IsInRole("Staff"))
        {
            var path = context.Request.Path.Value?.TrimEnd('/') ?? string.Empty;
            if (BlockedEndpoints.Any(blocked => path.StartsWith(blocked, StringComparison.OrdinalIgnoreCase)))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { message = "Staff members are not allowed to delete this resource." });
                return;
            }
        }

        await _next(context);
    }
}

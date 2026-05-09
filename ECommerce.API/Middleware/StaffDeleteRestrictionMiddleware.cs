using System.Security.Claims;

namespace ECommerce.API.Middleware;

public class StaffDeleteRestrictionMiddleware
{
    private readonly RequestDelegate _next;

    public StaffDeleteRestrictionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Method == HttpMethods.Delete)
        {
            if (context.User.Identity?.IsAuthenticated == true && context.User.IsInRole("Staff"))
            {
                // Instantly block DELETE for staff
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { message = "Staff members are not allowed to perform delete operations." });
                return;
            }
        }

        await _next(context);
    }
}

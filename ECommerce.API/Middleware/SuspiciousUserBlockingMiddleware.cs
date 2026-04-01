using Microsoft.AspNetCore.Mvc;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Middleware;

public class SuspiciousUserBlockingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SuspiciousUserBlockingMiddleware> _logger;

    public SuspiciousUserBlockingMiddleware(RequestDelegate next, ILogger<SuspiciousUserBlockingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        // Skip if user is not authenticated
        if (!context.User.Identity?.IsAuthenticated ?? true)
        {
            await _next(context);
            return;
        }

        var userIdClaim = context.User.FindFirst("uid") ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        
        if (userIdClaim == null)
        {
            await _next(context);
            return;
        }

        // Check ApplicationUser (authenticated users)
        var appUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userIdClaim.Value);
        
        if (appUser != null && appUser.IsSuspicious)
        {
            _logger.LogWarning("Suspicious ApplicationUser {UserId} blocked from accessing {Path}", userIdClaim.Value, context.Request.Path);
            
            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            
            var response = new 
            {
                success = false,
                message = "Your account has been suspended. Please contact support."
            };
            
            await context.Response.WriteAsJsonAsync(response);
            return;
        }

        // Also check Customer table (phone-based customers)
        var customer = await dbContext.Customers.FirstOrDefaultAsync(c => c.Phone == userIdClaim.Value);
        
        if (customer != null && customer.IsSuspicious)
        {
            _logger.LogWarning("Suspicious Customer {Phone} blocked from accessing {Path}", userIdClaim.Value, context.Request.Path);
            
            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            
            var response = new 
            {
                success = false,
                message = "Your account has been suspended. Please contact support."
            };
            
            await context.Response.WriteAsJsonAsync(response);
            return;
        }

        await _next(context);
    }
}

public static class SuspiciousUserBlockingExtensions
{
    public static IApplicationBuilder UseSuspiciousUserBlocking(this IApplicationBuilder app)
    {
        return app.UseMiddleware<SuspiciousUserBlockingMiddleware>();
    }
}

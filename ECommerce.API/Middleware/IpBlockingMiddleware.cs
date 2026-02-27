using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace ECommerce.API.Middleware;

public class IpBlockingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<IpBlockingMiddleware> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public IpBlockingMiddleware(RequestDelegate next, ILogger<IpBlockingMiddleware> logger, IServiceScopeFactory scopeFactory)
    {
        _next = next;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. Skip for Preflights & System Checks
        if (context.Request.Method == "OPTIONS")
        {
            await _next(context);
            return;
        }

        var ipAddress = context.Connection.RemoteIpAddress?.ToString();

        if (!string.IsNullOrEmpty(ipAddress))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                
                // Check if IP is blocked - wrap in try to catch missing table errors
                var isBlocked = await dbContext.BlockedIps.AnyAsync(b => b.IpAddress == ipAddress);
                if (isBlocked)
                {
                    _logger.LogWarning($"Blocked request from IP: {ipAddress}");
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    await context.Response.WriteAsync("Access Denied.");
                    return;
                }
            }
            catch (Exception ex)
            {
                // Silence DB-related errors (missing tables/connectivity) to keep site alive
                _logger.LogError(ex, "IP Blocking check failed. Continuing request.");
            }
        }

        await _next(context);
    }
}

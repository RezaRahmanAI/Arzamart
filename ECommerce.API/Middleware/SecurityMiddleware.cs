using System.Net;
using ECommerce.Infrastructure.Cache;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Middleware;

public class SecurityMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityMiddleware> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly AppCache _cache;

    public SecurityMiddleware(RequestDelegate next, ILogger<SecurityMiddleware> logger, IServiceScopeFactory scopeFactory, AppCache cache)
    {
        _next = next;
        _logger = logger;
        _scopeFactory = scopeFactory;
        _cache = cache;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. IP Blocking (cached)
        if (await IsIpBlockedAsync(context))
            return;

        // 2. Suspicious User Check (cached, authenticated users only)
        if (context.User.Identity?.IsAuthenticated == true)
        {
            if (await IsUserSuspiciousAsync(context))
                return;
        }

        await _next(context);
    }

    private async Task<bool> IsIpBlockedAsync(HttpContext context)
    {
        if (context.Request.Method == "OPTIONS")
            return false;

        var ipAddress = context.Connection.RemoteIpAddress?.ToString();
        if (string.IsNullOrEmpty(ipAddress))
            return false;

        var cacheKey = $"ip_blocked:{ipAddress}";
        var cached = _cache.GetSecurityFlag(cacheKey);
        if (cached.HasValue)
            return cached.Value;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var isBlocked = await dbContext.BlockedIps.AnyAsync(b => b.IpAddress == ipAddress);
            _cache.SetSecurityFlag(cacheKey, isBlocked, TimeSpan.FromSeconds(60));
            if (isBlocked)
            {
                _logger.LogWarning("Blocked request from IP: {IpAddress}", ipAddress);
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                await context.Response.WriteAsync("Access Denied.");
            }
            return isBlocked;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "IP blocking check failed. Continuing request.");
            _cache.SetSecurityFlag(cacheKey, false, TimeSpan.FromSeconds(30));
            return false;
        }
    }

    private async Task<bool> IsUserSuspiciousAsync(HttpContext context)
    {
        var userIdClaim = context.User.FindFirst("uid") ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return false;

        var cacheKey = $"user_suspicious:{userIdClaim.Value}";
        var cached = _cache.GetSecurityFlag(cacheKey);
        if (cached.HasValue)
            return cached.Value;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var isSuspicious = await dbContext.Users.AnyAsync(u => u.Id == userIdClaim.Value && u.IsSuspicious);
            if (!isSuspicious)
            {
                isSuspicious = await dbContext.Customers.AnyAsync(c => c.Phone == userIdClaim.Value && c.IsSuspicious);
            }

            _cache.SetSecurityFlag(cacheKey, isSuspicious, TimeSpan.FromSeconds(60));
            if (isSuspicious)
            {
                _logger.LogWarning("Suspicious user {UserId} blocked from accessing {Path}", userIdClaim.Value, context.Request.Path);
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { success = false, message = "Your account has been suspended. Please contact support." });
            }
            return isSuspicious;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Suspicious user check failed. Continuing request.");
            _cache.SetSecurityFlag(cacheKey, false, TimeSpan.FromSeconds(30));
            return false;
        }
    }
}

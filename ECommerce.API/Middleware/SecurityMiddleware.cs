using System.IdentityModel.Tokens.Jwt;
using System.Net;
using ECommerce.Core.Entities;
using Microsoft.Extensions.Caching.Memory;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Middleware;

public class SecurityMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityMiddleware> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMemoryCache _cache;

    public SecurityMiddleware(RequestDelegate next, ILogger<SecurityMiddleware> logger, IServiceScopeFactory scopeFactory, IMemoryCache cache)
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

        // 2. Revoked Token Check (after auth)
        if (context.User.Identity?.IsAuthenticated == true)
        {
            if (IsTokenRevoked(context))
                return;

            // 3. Suspicious User Check (cached)
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
        if (_cache.TryGetValue(cacheKey, out bool cachedBlocked))
            return cachedBlocked;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var isBlocked = await dbContext.BlockedIps.AnyAsync(b => b.IpAddress == ipAddress);
            _cache.Set(cacheKey, isBlocked, TimeSpan.FromSeconds(60));
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
            _cache.Set(cacheKey, false, TimeSpan.FromSeconds(30));
            return false;
        }
    }

    private bool IsTokenRevoked(HttpContext context)
    {
        var jti = context.User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
        if (string.IsNullOrEmpty(jti))
            return false;

        if (_cache.TryGetValue($"revoked_jti:{jti}", out _))
        {
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            context.Response.WriteAsJsonAsync(new { error = "TOKEN_REVOKED", message = "Token has been invalidated" }).Wait();
            return true;
        }

        return false;
    }

    private async Task<bool> IsUserSuspiciousAsync(HttpContext context)
    {
        var userIdClaim = context.User.FindFirst("uid") ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return false;

        var cacheKey = $"user_suspicious:{userIdClaim.Value}";
        if (_cache.TryGetValue(cacheKey, out bool cachedSuspicious))
            return cachedSuspicious;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var isSuspicious = await dbContext.Users.AnyAsync(u => u.Id == userIdClaim.Value && u.IsSuspicious);
            if (!isSuspicious)
            {
                isSuspicious = await dbContext.Customers.AnyAsync(c => c.Phone == userIdClaim.Value && c.IsSuspicious);
            }

            _cache.Set(cacheKey, isSuspicious, TimeSpan.FromSeconds(60));
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
            _cache.Set(cacheKey, false, TimeSpan.FromSeconds(30));
            return false;
        }
    }
}

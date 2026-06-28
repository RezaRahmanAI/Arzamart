using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ECommerce.Infrastructure.Cache;

namespace ECommerce.API.Middleware;

/// <summary>
/// Checks if the current access token's jti has been revoked.
/// Runs after authentication so ClaimsPrincipal is available.
/// If revoked, returns 401 Unauthorized.
/// </summary>
public class TokenRevocationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly AppCache _cache;

    public TokenRevocationMiddleware(RequestDelegate next, AppCache cache)
    {
        _next = next;
        _cache = cache;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User?.Identity?.IsAuthenticated == true)
        {
            var jti = context.User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
            if (!string.IsNullOrEmpty(jti) && _cache.IsTokenRevoked(jti))
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "token_revoked",
                    message = "This access token has been revoked. Please login again."
                });
                return;
            }
        }

        await _next(context);
    }
}

using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.API.Middleware
{
    public class RevokedTokenMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;

        public RevokedTokenMiddleware(RequestDelegate next, IMemoryCache cache)
        {
            _next = next;
            _cache = cache;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var jti = context.User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;

                if (!string.IsNullOrEmpty(jti))
                {
                    if (_cache.TryGetValue($"revoked_jti:{jti}", out _))
                    {
                        context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                        await context.Response.WriteAsJsonAsync(new { error = "TOKEN_REVOKED", message = "Token has been invalidated" });
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}

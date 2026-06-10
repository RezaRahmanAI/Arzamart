using System;
using System.Threading.Tasks;
using ECommerce.Infrastructure.Tracking;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ECommerce.API.Middleware
{
    public class VisitorTrackingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<VisitorTrackingMiddleware> _logger;

        public VisitorTrackingMiddleware(RequestDelegate next, ILogger<VisitorTrackingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower();
            if (path != null
                && context.Request.Method.Equals("GET", StringComparison.OrdinalIgnoreCase)
                && !path.StartsWith("/api")
                && !path.StartsWith("/admin")
                && !path.Contains("."))
            {
                var isNewVisitor = string.IsNullOrEmpty(context.Request.Cookies["VisitorId"]);

                if (isNewVisitor)
                {
                    var options = new CookieOptions
                    {
                        Expires = DateTime.UtcNow.AddDays(1),
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict
                    };
                    context.Response.Cookies.Append("VisitorId", Guid.NewGuid().ToString(), options);
                }

                var worker = context.RequestServices.GetService<VisitorTrackingWorker>();
                worker?.TrackVisit(isNewVisitor);
            }

            await _next(context);
        }
    }
}

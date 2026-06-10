using System;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
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

        public async Task InvokeAsync(HttpContext context, IServiceProvider serviceProvider)
        {
            // Skip API calls, static files, and admin routes
            var path = context.Request.Path.Value?.ToLower();
            if (path != null && !path.StartsWith("/api") && !path.StartsWith("/admin") && !path.Contains("."))
            {
                // Fire-and-forget: Don't block the response pipeline for analytics
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

                // Run DB write in background — never block the user response
                _ = Task.Run(async () =>
                {
                    try
                    {
                        using var scope = serviceProvider.CreateScope();
                        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var today = DateOnly.FromDateTime(DateTime.UtcNow);
                        
                        // Atomic increment — no entity load, no row lock contention
                        var affected = await dbContext.DailyTraffics
                            .Where(t => t.Date == today)
                            .ExecuteUpdateAsync(s => s
                                .SetProperty(t => t.PageViews, t => t.PageViews + 1)
                                .SetProperty(t => t.UniqueVisitors, t => isNewVisitor ? t.UniqueVisitors + 1 : t.UniqueVisitors));

                        if (affected == 0)
                        {
                            dbContext.DailyTraffics.Add(new DailyTraffic
                            {
                                Date = today,
                                PageViews = 1,
                                UniqueVisitors = isNewVisitor ? 1 : 0
                            });
                            await dbContext.SaveChangesAsync();
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Visitor tracking failed silently");
                    }
                });
            }

            await _next(context);
        }
    }
}

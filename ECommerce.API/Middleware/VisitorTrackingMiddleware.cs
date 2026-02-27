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
                        
                        var traffic = await dbContext.DailyTraffics.FirstOrDefaultAsync(t => t.Date == today);
                        if (traffic == null)
                        {
                            traffic = new DailyTraffic
                            {
                                Date = today,
                                PageViews = 0,
                                UniqueVisitors = 0
                            };
                            dbContext.DailyTraffics.Add(traffic);
                        }

                        traffic.PageViews++;
                        if (isNewVisitor) traffic.UniqueVisitors++;

                        await dbContext.SaveChangesAsync();
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

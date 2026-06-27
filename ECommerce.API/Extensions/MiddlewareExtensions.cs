using ECommerce.API.Middleware;

namespace ECommerce.API.Extensions;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseAppExceptionHandling(this IApplicationBuilder app)
    {
        app.UseMiddleware<GlobalExceptionMiddleware>();
        return app;
    }

    public static IApplicationBuilder UseAppSecurityMiddleware(this IApplicationBuilder app)
    {
        app.UseMiddleware<RequestLoggingMiddleware>();
        app.UseMiddleware<VisitorTrackingMiddleware>();

        return app;
    }
}

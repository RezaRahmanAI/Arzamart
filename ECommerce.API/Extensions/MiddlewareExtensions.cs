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
        // 2. Request Logging
        app.UseMiddleware<RequestLoggingMiddleware>();

        // 3. Security & Access
        app.UseMiddleware<IpBlockingMiddleware>();
        app.UseMiddleware<VisitorTrackingMiddleware>();

        return app;
    }

    public static IApplicationBuilder UseAppPipeline(this IApplicationBuilder app, IWebHostEnvironment env)
    {
        // Order is critical in the pipeline
        
        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();
        app.UseResponseCompression();
        app.UseStaticFiles();

        // Serve media from uploads path (Already handled in Program.cs but could be moved here)
        
        app.UseRouting();
        
        // CORS must be before Auth
        app.UseCors("DefaultPolicy");

        app.UseAuthentication();
        app.UseMiddleware<RevokedTokenMiddleware>();
        app.UseAuthorization();

        app.UseResponseCaching();

        return app;
    }
}

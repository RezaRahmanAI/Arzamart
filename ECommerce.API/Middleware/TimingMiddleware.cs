using System.Diagnostics;

namespace ECommerce.API.Middleware;

public class TimingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TimingMiddleware> _logger;

    public TimingMiddleware(RequestDelegate next, ILogger<TimingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        
        // Add start time to items for possible later use
        context.Items["RequestStartTime"] = sw;

        await _next(context);
        
        sw.Stop();

        var elapsedMs = sw.ElapsedMilliseconds;

        // Log slow requests (> 500ms)
        if (elapsedMs > 500)
        {
            _logger.LogWarning("Slow request: {Method} {Path} took {ElapsedMs}ms", 
                context.Request.Method, 
                context.Request.Path, 
                elapsedMs);
        }

        // Add response header for performance transparency
        if (!context.Response.HasStarted)
        {
            context.Response.Headers["X-Response-Time"] = $"{elapsedMs}ms";
        }
    }
}

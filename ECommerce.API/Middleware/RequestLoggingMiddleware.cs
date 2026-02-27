using System.Diagnostics;
using System.Text.Json;

namespace ECommerce.API.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        var request = context.Request;

        try
        {
            await _next(context);
            
            sw.Stop();
            var statusCode = context.Response.StatusCode;
            
            // Log successful or expected responses
            if (statusCode < 500)
            {
                _logger.LogInformation(
                    "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMilliseconds}ms",
                    request.Method,
                    request.Path,
                    statusCode,
                    sw.ElapsedMilliseconds);
            }
        }
        catch (Exception)
        {
            sw.Stop();
            _logger.LogError(
                "HTTP {Method} {Path} failed in {ElapsedMilliseconds}ms",
                request.Method,
                request.Path,
                sw.ElapsedMilliseconds);
            throw; // Re-throw to be caught by ExceptionMiddleware
        }
    }
}

using System.Diagnostics;
using System.Text.Json;

namespace ECommerce.API.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;
    private static readonly HashSet<string> SensitiveParams = new(StringComparer.OrdinalIgnoreCase)
    {
        "password", "token", "secret", "phone", "authorization"
    };

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
                    "HTTP {Method} {PathAndQuery} responded {StatusCode} in {ElapsedMilliseconds}ms",
                    request.Method,
                    SanitizeQueryString(request.Path + request.QueryString),
                    statusCode,
                    sw.ElapsedMilliseconds);
            }
        }
        catch (Exception)
        {
            sw.Stop();
            _logger.LogError(
                "HTTP {Method} {PathAndQuery} failed in {ElapsedMilliseconds}ms",
                request.Method,
                SanitizeQueryString(request.Path + request.QueryString),
                sw.ElapsedMilliseconds);
            throw; // Re-throw to be caught by ExceptionMiddleware
        }
    }

    private static string SanitizeQueryString(string pathAndQuery)
    {
        var queryStart = pathAndQuery.IndexOf('?');
        if (queryStart < 0) return pathAndQuery;

        var path = pathAndQuery[..queryStart];
        var queryString = pathAndQuery[queryStart..];

        foreach (var param in SensitiveParams)
        {
            queryString = System.Text.RegularExpressions.Regex.Replace(
                queryString,
                $@"({System.Text.RegularExpressions.Regex.Escape(param)}=)([^&]*)",
                "$1[REDACTED]",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }

        return path + queryString;
    }
}

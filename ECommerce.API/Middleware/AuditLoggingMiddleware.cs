using System.Diagnostics;
using System.Security.Claims;

namespace ECommerce.API.Middleware;

/// <summary>
/// Logs all mutating requests (POST, PUT, PATCH, DELETE) with user info, IP, and response status.
/// Writes structured logs to ILogger for ingestion by log aggregation systems.
/// </summary>
public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditLoggingMiddleware> _logger;

    public AuditLoggingMiddleware(RequestDelegate next, ILogger<AuditLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var method = context.Request.Method;
        if (method is not ("POST" or "PUT" or "PATCH" or "DELETE"))
        {
            await _next(context);
            return;
        }

        var sw = Stopwatch.StartNew();
        var originalBodyStream = context.Response.Body;

        try
        {
            await _next(context);
        }
        finally
        {
            sw.Stop();
            var statusCode = context.Response.StatusCode;
            var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? context.User?.FindFirst("sub")?.Value
                         ?? "anonymous";
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var path = context.Request.Path.Value ?? "";
            var queryString = context.Request.QueryString.Value ?? "";

            var logLevel = statusCode >= 500 ? LogLevel.Error
                         : statusCode >= 400 ? LogLevel.Warning
                         : LogLevel.Information;

            _logger.Log(logLevel,
                "[Audit] {Method} {Path}{Query} -> {StatusCode} by {UserId} from {IP} in {ElapsedMs}ms",
                method, path, queryString, statusCode, userId, ip, sw.ElapsedMilliseconds);
        }
    }
}

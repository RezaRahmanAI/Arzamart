using System.IO;
using System.Net;
using System.Text;
using System.Text.Json;

namespace ECommerce.API.Middleware;

/// <summary>
/// Validates Content-Type on mutating requests (POST, PUT, PATCH).
/// Rejects XML payloads (prevents XXE attacks) and validates
/// multipart boundaries aren't maliciously oversized.
/// </summary>
public class ContentTypeValidationMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/json",
        "application/x-www-form-urlencoded",
        "multipart/form-data",
        "application/octet-stream",
        "text/plain"
    };

    public ContentTypeValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Allow CORS preflight requests to pass through without validation
        if (context.Request.Method == "OPTIONS")
        {
            await _next(context);
            return;
        }

        var method = context.Request.Method;
        if (method is "POST" or "PUT" or "PATCH")
        {
            var contentType = context.Request.ContentType ?? "";

            // Block XML content types (XXE prevention)
            if (contentType.Contains("xml", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = (int)HttpStatusCode.UnsupportedMediaType;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "XML content types are not supported",
                    message = "Please use JSON instead of XML."
                });
                return;
            }

            // Validate multipart size (prevent oversized boundary DoS)
            if (contentType.Contains("multipart/form-data"))
            {
                var contentLength = context.Request.ContentLength ?? 0;
                const long maxSize = 100 * 1024 * 1024; // 100 MB
                if (contentLength > maxSize)
                {
                    context.Response.StatusCode = (int)HttpStatusCode.RequestEntityTooLarge;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        error = "Request body too large",
                        maxSize = "100 MB"
                    });
                    return;
                }
            }

            // For JSON requests, validate it's not empty on POST/PUT
            if (contentType.StartsWith("application/json") &&
                method is "POST" or "PUT" &&
                (context.Request.ContentLength ?? 0) == 0)
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Request body is required"
                });
                return;
            }
        }

        await _next(context);
    }
}

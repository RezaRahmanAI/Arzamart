using Microsoft.AspNetCore.Http;
using System.Net;
using System.Text.Json;

namespace ECommerce.API.Middleware;

/// <summary>
/// Global exception handling middleware
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. Unified CORS & Preflight Handler
        if (context.Request.Headers.TryGetValue("Origin", out var origin))
        {
            context.Response.Headers["Access-Control-Allow-Origin"] = origin;
            context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
            context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
            context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, X-Session-Id, Accept, Origin, X-Pagination";

            if (context.Request.Method == "OPTIONS")
            {
                context.Response.StatusCode = 200;
                return;
            }
        }

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            
            // Ensure headers persist even if cleared during exception
            if (context.Request.Headers.TryGetValue("Origin", out var failOrigin))
            {
                context.Response.Headers["Access-Control-Allow-Origin"] = failOrigin;
                context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
            }

            await HandleExceptionAsync(context, ex, _env);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception, IHostEnvironment env)
    {
        context.Response.ContentType = "application/json";
        
        var statusCode = HttpStatusCode.InternalServerError;
        var message = "An error occurred processing your request";
        var detail = exception.Message;

        switch (exception)
        {
            case ArgumentNullException:
            case ArgumentException:
                statusCode = HttpStatusCode.BadRequest;
                message = "Invalid request parameters";
                break;
            
            case UnauthorizedAccessException:
                statusCode = HttpStatusCode.Forbidden;
                message = "Permission denied: The server process does not have write access. Please check the folder permissions.";
                break;
            
            case KeyNotFoundException:
                statusCode = HttpStatusCode.NotFound;
                message = "Requested resource not found";
                break;
        }

        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            success = false,
            message = message,
            error = env.IsDevelopment() ? detail : null,
            stackTrace = env.IsDevelopment() ? exception.StackTrace : null
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var jsonResponse = JsonSerializer.Serialize(response, options);
        await context.Response.WriteAsync(jsonResponse);
    }
}

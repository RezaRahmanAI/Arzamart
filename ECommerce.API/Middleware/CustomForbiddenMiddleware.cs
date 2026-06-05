using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace ECommerce.API.Middleware;

public class CustomForbiddenMiddleware
{
    private readonly RequestDelegate _next;

    public CustomForbiddenMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        await _next(context);

        if (!context.Response.HasStarted)
        {
            if (context.Response.StatusCode == (int)HttpStatusCode.Forbidden)
            {
                context.Response.ContentType = "application/json";
                var errorResponse = new
                {
                    success = false,
                    error = "insufficient_permissions",
                    message = "You do not have permission to perform this action"
                };
                
                var json = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                
                await context.Response.WriteAsync(json);
            }
            else if (context.Response.StatusCode == (int)HttpStatusCode.Unauthorized)
            {
                context.Response.ContentType = "application/json";
                var errorResponse = new
                {
                    success = false,
                    error = "UNAUTHORIZED",
                    message = "You are not authorized to perform this action"
                };

                var json = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                await context.Response.WriteAsync(json);
            }
        }
    }
}

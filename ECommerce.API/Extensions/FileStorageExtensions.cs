using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;

namespace ECommerce.API.Extensions;

public static class FileStorageExtensions
{
    public static string ConfigureExternalMedia(this IApplicationBuilder app, IConfiguration config, IWebHostEnvironment env)
    {
        string externalMediaPath;

        try
        {
            externalMediaPath = ResolveMediaPath(config, env);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"WARNING: External media path resolution failed: {ex.Message}");
            externalMediaPath = Path.Combine(Path.GetTempPath(), "ArzaMedia");
        }

        try
        {
            Directory.CreateDirectory(externalMediaPath);
            EnsureUploadDirectories(externalMediaPath);

            // Intercept missing files in /uploads and serve the placeholder image
            app.Use(async (context, next) =>
            {
                if (context.Request.Path.StartsWithSegments("/uploads"))
                {
                    var requestPath = context.Request.Path.Value ?? "";
                    var ext = Path.GetExtension(requestPath).ToLowerInvariant();
                    if (ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".webp" || ext == ".jfif" || ext == ".svg" || ext == ".ico")
                    {
                        var relativePath = requestPath.Substring("/uploads".Length).TrimStart('/');
                        var physicalPath = Path.Combine(externalMediaPath, relativePath);

                        if (!File.Exists(physicalPath))
                        {
                            context.Response.ContentType = "image/png";
                            context.Response.StatusCode = 200;
                            var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
                            var placeholderPath = Path.Combine(webRoot, "placeholder.png");

                            if (File.Exists(placeholderPath))
                            {
                                await context.Response.SendFileAsync(placeholderPath);
                                return; // Short-circuit, do not serve 404
                            }
                        }
                    }
                }

                await next();
            });

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(externalMediaPath),
                RequestPath = "/uploads",
                OnPrepareResponse = ctx =>
                {
                    ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000,immutable");
                }
            });
        }
        catch (Exception ex)
        {
            // Never crash app startup because of directory permissions.
            Console.Error.WriteLine($"WARNING: External media static file host disabled: {ex.Message}");
        }

        return externalMediaPath;
    }

    private static string ResolveMediaPath(IConfiguration config, IWebHostEnvironment env)
    {
        var configuredPath = config["ExternalMediaPath"];
        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            return configuredPath;
        }

        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        return Path.Combine(webRoot, "uploads");
    }

    private static void EnsureUploadDirectories(string rootPath)
    {
        var uploadPaths = new[]
        {
            Path.Combine(rootPath, "categories"),
            Path.Combine(rootPath, "products"),
            Path.Combine(rootPath, "banners"),
            Path.Combine(rootPath, "subcategories")
        };

        foreach (var path in uploadPaths)
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
        }
    }
}

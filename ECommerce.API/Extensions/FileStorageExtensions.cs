using Microsoft.Extensions.FileProviders;

namespace ECommerce.API.Extensions;

public static class FileStorageExtensions
{
    public static string ConfigureExternalMedia(this IApplicationBuilder app, IConfiguration config, IWebHostEnvironment env)
    {
        string externalMediaPath;
        try
        {
            externalMediaPath = config["ExternalMediaPath"] ?? "";
            
            if (string.IsNullOrEmpty(externalMediaPath))
            {
                var contentRoot = env.ContentRootPath;
                var parent = Directory.GetParent(contentRoot);
                
                externalMediaPath = parent != null 
                    ? Path.Combine(parent.FullName, "ArzaMedia") 
                    : Path.Combine(contentRoot, "ArzaMedia");
            }

            if (!Directory.Exists(externalMediaPath))
            {
                Directory.CreateDirectory(externalMediaPath);
            }
        }
        catch (Exception)
        {
            externalMediaPath = Path.Combine(env.ContentRootPath, "Media");
            if (!Directory.Exists(externalMediaPath)) Directory.CreateDirectory(externalMediaPath);
        }

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(externalMediaPath),
            RequestPath = "/uploads",
            OnPrepareResponse = ctx =>
            {
                ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000,immutable");
            }
        });

        // Ensure subdirectories exist
        EnsureUploadDirectories(externalMediaPath);

        return externalMediaPath;
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

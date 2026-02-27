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

        var contentRoot = env.ContentRootPath;
        var parent = Directory.GetParent(contentRoot);

        return parent != null
            ? Path.Combine(parent.FullName, "ArzaMedia")
            : Path.Combine(contentRoot, "ArzaMedia");
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

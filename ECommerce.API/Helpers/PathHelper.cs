using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace ECommerce.API.Helpers;

public static class PathHelper
{
    public static string ResolveMediaPath(IConfiguration config, IWebHostEnvironment env)
    {
        var configuredPath = config["ExternalMediaPath"];
        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            return configuredPath;
        }

        return Path.Combine(env.ContentRootPath, "wwwroot", "uploads");
    }

    public static string GetUploadsFolder(IConfiguration config, IWebHostEnvironment env, string subFolder)
    {
        var root = ResolveMediaPath(config, env);
        var folder = Path.Combine(root, subFolder);
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }
        return folder;
    }
}

using ECommerce.Infrastructure.Cache;

namespace ECommerce.API.Middleware;

public class CacheVersionMiddleware
{
    private readonly RequestDelegate _next;

    private static readonly HashSet<string> ExcludedPrefixes = new(StringComparer.OrdinalIgnoreCase)
    {
        "/admin", "/auth", "/cart", "/orders", "/checkout", "/profile", "/payment"
    };

    public CacheVersionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppCache cache)
    {
        if (HttpMethods.IsGet(context.Request.Method) && context.Request.Path.StartsWithSegments("/api"))
        {
            var path = context.Request.Path.Value!;
            if (!IsExcluded(path))
            {
                var datasets = GetDatasetsForPath(path);
                if (datasets.Count > 0)
                {
                    var etag = cache.GetCompositeEtag(datasets.ToArray());
                    var lastModified = GetLastModified(cache, datasets);

                    context.Response.OnStarting(() =>
                    {
                        if (!context.Response.HasStarted)
                        {
                            context.Response.Headers["Cache-Version"] = etag;
                            if (!string.IsNullOrEmpty(etag))
                                context.Response.Headers["ETag"] = $"\"{etag}\"";
                            if (lastModified.HasValue)
                                context.Response.Headers["Last-Modified"] = lastModified.Value.ToString("R");
                        }
                        return Task.CompletedTask;
                    });

                    var ifNoneMatch = context.Request.Headers["If-None-Match"].FirstOrDefault();
                    if (!string.IsNullOrEmpty(ifNoneMatch))
                    {
                        var etagValue = ifNoneMatch.Trim('"');
                        if (etagValue == etag)
                        {
                            context.Response.StatusCode = 304;
                            return;
                        }
                    }
                }
            }
        }

        await _next(context);
    }

    private static bool IsExcluded(string path)
    {
        foreach (var prefix in ExcludedPrefixes)
        {
            if (path.Contains(prefix, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }

    private static List<string> GetDatasetsForPath(string path)
    {
        var datasets = new List<string>();

        if (path.Contains("/navigation", StringComparison.OrdinalIgnoreCase))
            datasets.Add("navigation");
        if (path.Contains("/categories", StringComparison.OrdinalIgnoreCase))
            datasets.Add("categories");
        if (path.Contains("/subcategories", StringComparison.OrdinalIgnoreCase))
            datasets.Add("subcategories");
        if (path.Contains("/banners", StringComparison.OrdinalIgnoreCase))
            datasets.Add("banners");
        if (path.Contains("/sitesettings", StringComparison.OrdinalIgnoreCase))
            datasets.Add("settings");
        if (path.Contains("/home", StringComparison.OrdinalIgnoreCase))
        {
            datasets.Add("homepage");
            datasets.Add("banners");
            datasets.Add("products");
        }
        if (path.Contains("/products", StringComparison.OrdinalIgnoreCase))
            datasets.Add("products");
        if (path.Contains("/reviews", StringComparison.OrdinalIgnoreCase))
            datasets.Add("products");
        if (path.Contains("/custom-landing-page", StringComparison.OrdinalIgnoreCase))
            datasets.Add("homepage");

        return datasets;
    }

    private static DateTime? GetLastModified(AppCache cache, List<string> datasets)
    {
        DateTime? latest = null;
        foreach (var ds in datasets)
        {
            if (cache.CacheLastModified.TryGetValue(ds, out var dt))
            {
                if (latest == null || dt > latest.Value)
                    latest = dt;
            }
        }
        return latest;
    }
}

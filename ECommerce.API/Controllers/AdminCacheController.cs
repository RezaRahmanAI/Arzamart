using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/cache")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminCacheController : ControllerBase
{
    private readonly IOutputCacheStore _cacheStore;
    private readonly ICacheService _cache;

    public AdminCacheController(IOutputCacheStore cacheStore, ICacheService cache)
    {
        _cacheStore = cacheStore;
        _cache = cache;
    }

    [HttpPost("evict")]
    public async Task<IActionResult> EvictCache([FromBody] EvictCacheRequest request)
    {
        if (request.Tags == null || !request.Tags.Any())
            return BadRequest("No tags provided for eviction");

        foreach (var tag in request.Tags)
        {
            // 1. Evict from Output Cache (Tag-based)
            await _cacheStore.EvictByTagAsync(tag, default);

            // 2. Evict specific keys from custom CacheService based on tags
            // This mirrors logic found in other controllers
            if (tag == "catalog")
            {
                // Catalog updates often affect home page lists
                await _cache.RemoveAsync("home_new_arrivals");
                await _cache.RemoveAsync("home_featured_products");
            }
            else if (tag == "home")
            {
                await _cache.RemoveAsync("home_banners");
                await _cache.RemoveAsync("home_featured_products");
                await _cache.RemoveAsync("home_new_arrivals");
            }
            else if (tag == "config")
            {
                await _cache.RemoveAsync("site_settings");
                await _cache.RemoveAsync("navigation_menu");
            }
            else if (tag == "content")
            {
                await _cache.RemoveAsync("pages_list");
            }
        }

        return Ok(new { message = "Cache evicted successfully", tags = request.Tags });
    }
}

public class EvictCacheRequest
{
    public List<string> Tags { get; set; } = new();
}

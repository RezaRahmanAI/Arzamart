using Microsoft.Extensions.Caching.Memory;
using ECommerce.Core.Constants;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/sitesettings")]
    [Microsoft.AspNetCore.OutputCaching.OutputCache(Tags = new[] { "config" })]
    public class SiteSettingsController : ControllerBase
    {
        private readonly IPublicSiteSettingsService _publicSiteSettingsService;
        private readonly IMemoryCache _cache;

        public SiteSettingsController(IPublicSiteSettingsService publicSiteSettingsService, IMemoryCache cache)
        {
            _publicSiteSettingsService = publicSiteSettingsService;
            _cache = cache;
        }

        [HttpGet]
        [Microsoft.AspNetCore.OutputCaching.OutputCache(Duration = 3600)]
        [ResponseCache(Duration = 600)]
        public async Task<ActionResult<SiteSettingsDto>> GetSettings()
        {
            const string cacheKey = "site_settings";

            if (_cache.TryGetValue(cacheKey, out SiteSettingsDto? cached) && cached != null)
            {
                return Ok(cached);
            }

            var settings = await _publicSiteSettingsService.GetSettingsAsync();

            _cache.Set(cacheKey, settings, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = CacheDurations.Extended });
            return Ok(settings);
        }

        [HttpGet("delivery-methods")]
        [Microsoft.AspNetCore.OutputCaching.OutputCache(Duration = 3600)]
        [ResponseCache(Duration = 600)]
        public async Task<ActionResult<IEnumerable<DeliveryMethod>>> GetDeliveryMethods()
        {
            const string cacheKey = "delivery_methods_active";

            if (_cache.TryGetValue(cacheKey, out IEnumerable<DeliveryMethod>? cached) && cached != null)
            {
                return Ok(cached);
            }

            var methods = await _publicSiteSettingsService.GetActiveDeliveryMethodsAsync();

            _cache.Set(cacheKey, methods, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = CacheDurations.Extended });
            return Ok(methods);
        }
    }
}

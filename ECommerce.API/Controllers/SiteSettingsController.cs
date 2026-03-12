using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ECommerce.Infrastructure.Data;
using ECommerce.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SiteSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;

        public SiteSettingsController(ApplicationDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        [HttpGet]
        [ResponseCache(Duration = 600)]
        public async Task<ActionResult<SiteSetting>> GetSettings()
        {
            const string cacheKey = "site_settings";

            if (_cache.TryGetValue(cacheKey, out SiteSetting? cached) && cached != null)
            {
                return Ok(cached);
            }

            var settings = await _context.SiteSettings.FirstOrDefaultAsync();
            
            if (settings == null)
            {
                settings = new SiteSetting();
            }

            _cache.Set(cacheKey, settings, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
            return Ok(settings);
        }

        [HttpGet("delivery-methods")]
        [ResponseCache(Duration = 600)]
        public async Task<ActionResult<IEnumerable<DeliveryMethod>>> GetDeliveryMethods()
        {
            const string cacheKey = "delivery_methods_active";

            if (_cache.TryGetValue(cacheKey, out IEnumerable<DeliveryMethod>? cached) && cached != null)
            {
                return Ok(cached);
            }

            var methods = await _context.DeliveryMethods
                .Where(m => m.IsActive)
                .ToListAsync();

            _cache.Set(cacheKey, methods, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
            return Ok(methods);
        }
    }
}

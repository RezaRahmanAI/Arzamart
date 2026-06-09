using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/sitesettings")]
    public class SiteSettingsController : ControllerBase
    {
        private readonly IPublicSiteSettingsService _publicSiteSettingsService;

        public SiteSettingsController(IPublicSiteSettingsService publicSiteSettingsService)
        {
            _publicSiteSettingsService = publicSiteSettingsService;
        }

        [HttpGet]
        public async Task<ActionResult<SiteSettingsDto>> GetSettings()
        {
            var settings = await _publicSiteSettingsService.GetSettingsAsync();
            return Ok(settings);
        }

        [HttpGet("delivery-methods")]
        public async Task<ActionResult<IEnumerable<DeliveryMethod>>> GetDeliveryMethods()
        {
            var methods = await _publicSiteSettingsService.GetActiveDeliveryMethodsAsync();
            return Ok(methods);
        }
    }
}

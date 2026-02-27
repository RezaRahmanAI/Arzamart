using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SiteSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SiteSettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<SiteSetting>> GetSettings()
        {
            var settings = await _context.SiteSettings.FirstOrDefaultAsync();
            
            if (settings == null)
            {
                return Ok(new SiteSetting()); // Return default if not set
            }

            // For public API, we might want to return a DTO to hide sensitive info like Stripe Secret Key if it were stored here.
            // But currently SiteSetting only has public info + pixel IDs which are public in HTML anyway.
            // Stripe Publishable Key is public.
            
            return Ok(settings);
        }

        [HttpGet("delivery-methods")]
        public async Task<ActionResult<IEnumerable<DeliveryMethod>>> GetDeliveryMethods()
        {
            return await _context.DeliveryMethods
                .Where(m => m.IsActive)
                .ToListAsync();
        }
    }
}

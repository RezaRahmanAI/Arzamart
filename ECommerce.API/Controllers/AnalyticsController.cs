using System.Threading.Tasks;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,SuperAdmin,Staff")]
    [ECommerce.API.Helpers.StaffMenuAccess("analytics")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpGet("daily")]
        public async Task<IActionResult> GetDailyTraffic()
        {
            var traffic = await _analyticsService.GetDailyTrafficAsync();
            return Ok(traffic);
        }
    }
}

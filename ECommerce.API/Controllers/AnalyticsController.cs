using System;
using System.Threading.Tasks;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AnalyticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("daily")]
        public async Task<IActionResult> GetDailyTraffic()
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var traffic = await _context.DailyTraffics
                .FirstOrDefaultAsync(t => t.Date == today);

            if (traffic == null)
            {
                return Ok(new
                {
                    Date = today,
                    PageViews = 0,
                    UniqueVisitors = 0
                });
            }

            return Ok(new
            {
                traffic.Date,
                traffic.PageViews,
                traffic.UniqueVisitors
            });
        }
    }
}

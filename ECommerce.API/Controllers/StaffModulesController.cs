using System.Linq;
using System.Threading.Tasks;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[Authorize]
[ApiController]
[Route("api/staff/modules")]
public class StaffModulesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StaffModulesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetModules()
    {
        var modules = await _context.StaffModules
            .Include(m => m.Permissions)
            .OrderBy(m => m.Name)
            .Select(m => new
            {
                id = m.Id,
                name = m.Name,
                slug = m.Slug,
                description = m.Description,
                permissions = m.Permissions.Select(p => new
                {
                    id = p.Id,
                    action = p.Action
                }).OrderBy(p => p.action).ToList()
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = modules,
            message = "Modules and permissions retrieved successfully."
        });
    }
}

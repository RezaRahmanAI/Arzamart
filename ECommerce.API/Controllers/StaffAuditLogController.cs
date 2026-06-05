using System;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[Authorize(Policy = "SuperAdminOnly")]
[ApiController]
[Route("api/staff/audit-log")]
public class StaffAuditLogController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StaffAuditLogController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] Guid? actorId,
        [FromQuery] string? action,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _context.StaffAuditLogs
            .IgnoreQueryFilters()
            .Include(al => al.Actor)
            .Include(al => al.TargetStaff)
            .AsQueryable();

        // Filter by actor
        if (actorId.HasValue)
        {
            query = query.Where(al => al.ActorId == actorId.Value);
        }

        // Filter by action (exact or prefix match)
        if (!string.IsNullOrWhiteSpace(action))
        {
            var actionLower = action.ToLower();
            query = query.Where(al => al.Action.ToLower().Contains(actionLower));
        }

        // Filter by date range
        if (startDate.HasValue)
        {
            query = query.Where(al => al.CreatedAt >= startDate.Value);
        }
        if (endDate.HasValue)
        {
            // Set end date to end of the day if it lacks time details
            var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(al => al.CreatedAt <= endOfDay);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(al => al.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(al => new
            {
                id = al.Id,
                actorId = al.ActorId,
                actorName = al.Actor != null ? al.Actor.FullName : "System",
                actorUsername = al.Actor != null ? al.Actor.Username : "system",
                action = al.Action,
                targetStaffId = al.TargetStaffId,
                targetStaffName = al.TargetStaff != null ? al.TargetStaff.FullName : null,
                details = al.Details,
                createdAt = al.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                items,
                page,
                pageSize,
                totalCount
            },
            message = "Audit logs retrieved successfully."
        });
    }
}

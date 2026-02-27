using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ECommerce.API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/admin/security")]
[ApiController]
public class AdminSecurityController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminSecurityController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("blocked-ips")]
    public async Task<ActionResult<IEnumerable<BlockedIp>>> GetBlockedIps()
    {
        return await _context.BlockedIps.OrderByDescending(b => b.BlockedAt).ToListAsync();
    }

    [HttpPost("block-ip")]
    public async Task<ActionResult<BlockedIp>> BlockIpAddress([FromBody] BlockedIp ipToBlock)
    {
        if (string.IsNullOrEmpty(ipToBlock.IpAddress))
        {
            return BadRequest("IP Address is required.");
        }

        var existing = await _context.BlockedIps.FirstOrDefaultAsync(b => b.IpAddress == ipToBlock.IpAddress);
        if (existing != null)
        {
            return BadRequest("IP Address is already blocked.");
        }

        ipToBlock.BlockedAt = DateTime.UtcNow;
        ipToBlock.BlockedBy = User.Identity?.Name ?? "Admin";

        _context.BlockedIps.Add(ipToBlock);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBlockedIps), new { id = ipToBlock.Id }, ipToBlock);
    }

    [HttpPost("unblock-ip/{id}/delete")]
    public async Task<IActionResult> UnblockIp(int id)
    {
        var blockedIp = await _context.BlockedIps.FindAsync(id);
        if (blockedIp == null)
        {
            return NotFound();
        }

        _context.BlockedIps.Remove(blockedIp);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

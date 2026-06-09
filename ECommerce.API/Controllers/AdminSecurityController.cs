using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("security")]
[Route("api/admin/security")]
[ApiController]
public class AdminSecurityController : ControllerBase
{
    private readonly IAdminSecurityService _securityService;

    public AdminSecurityController(IAdminSecurityService securityService)
    {
        _securityService = securityService;
    }

    [HttpGet("blocked-ips")]
    public async Task<ActionResult<IEnumerable<BlockedIp>>> GetBlockedIps()
    {
        return await _securityService.GetBlockedIpsAsync();
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("block-ip")]
    public async Task<ActionResult<BlockedIp>> BlockIpAddress([FromBody] BlockedIp ipToBlock)
    {
        if (string.IsNullOrEmpty(ipToBlock.IpAddress))
        {
            return BadRequest("IP Address is required.");
        }

        try
        {
            ipToBlock.BlockedAt = DateTime.UtcNow;
            ipToBlock.BlockedBy = User.Identity?.Name ?? "Admin";

            var result = await _securityService.BlockIpAsync(ipToBlock);
            return CreatedAtAction(nameof(GetBlockedIps), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpDelete("unblock-ip/{id}")]
    public async Task<IActionResult> UnblockIp(int id)
    {
        try
        {
            await _securityService.UnblockIpAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }
}

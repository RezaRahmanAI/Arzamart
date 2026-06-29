using ECommerce.Core.DTOs.Admin;
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
    public async Task<ActionResult<IEnumerable<BlockedIpDto>>> GetBlockedIps()
    {
        var ips = await _securityService.GetBlockedIpsAsync();
        return Ok(ips.Select(ip => new BlockedIpDto
        {
            Id = ip.Id,
            IpAddress = ip.IpAddress,
            Reason = ip.Reason,
            BlockedAt = ip.BlockedAt,
            BlockedBy = ip.BlockedBy
        }));
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("block-ip")]
    public async Task<ActionResult<BlockedIpDto>> BlockIpAddress([FromBody] BlockIpRequestDto dto)
    {
        if (string.IsNullOrEmpty(dto.IpAddress))
        {
            return BadRequest("IP Address is required.");
        }

        try
        {
            var blockedBy = User.Identity?.Name ?? "Admin";
            var result = await _securityService.BlockIpAddressAsync(dto.IpAddress, dto.Reason, blockedBy);
            return CreatedAtAction(nameof(GetBlockedIps), new { id = result.Id }, new BlockedIpDto
            {
                Id = result.Id,
                IpAddress = result.IpAddress,
                Reason = result.Reason,
                BlockedAt = result.BlockedAt,
                BlockedBy = result.BlockedBy
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("unblock-ip/{id}/delete")]
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

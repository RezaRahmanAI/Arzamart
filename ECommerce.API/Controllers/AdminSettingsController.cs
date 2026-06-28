using ECommerce.API.Helpers;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("settings")]
[Route("api/admin/settings")]
public class AdminSettingsController : ControllerBase
{
    private readonly IAdminSettingsService _settingsService;
    private readonly IFileUploadService _fileUploadService;

    public AdminSettingsController(IAdminSettingsService settingsService, IFileUploadService fileUploadService)
    {
        _settingsService = settingsService;
        _fileUploadService = fileUploadService;
    }

    [HttpGet]
    public async Task<ActionResult<SiteSettingsDto>> GetSettings()
    {
        var settings = await _settingsService.GetSettingsAsync();
        return Ok(settings);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPut]
    public async Task<ActionResult<SiteSettingsDto>> UpdateSettings([FromBody] SiteSettingsDto dto)
    {
        var result = await _settingsService.UpdateSettingsAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("media")]
    public async Task<ActionResult<UploadResultDto>> UploadLogo(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var url = await _fileUploadService.UploadAsync(file, "settings");
        return Ok(new UploadResultDto { Url = url });
    }

    [HttpGet("delivery-methods")]
    public async Task<ActionResult<IEnumerable<DeliveryMethodDto>>> GetDeliveryMethods()
    {
        var methods = await _settingsService.GetDeliveryMethodsAsync();
        return Ok(methods);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("delivery-methods")]
    public async Task<ActionResult<DeliveryMethodDto>> CreateDeliveryMethod([FromBody] DeliveryMethodDto dto)
    {
        var method = await _settingsService.CreateDeliveryMethodAsync(dto);
        return CreatedAtAction(nameof(GetDeliveryMethods), new { id = method.Id }, method);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPut("delivery-methods/{id}")]
    public async Task<IActionResult> UpdateDeliveryMethod(int id, [FromBody] DeliveryMethodDto dto)
    {
        try
        {
            await _settingsService.UpdateDeliveryMethodAsync(id, dto);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpDelete("delivery-methods/{id}")]
    public async Task<IActionResult> DeleteDeliveryMethod(int id)
    {
        try
        {
            await _settingsService.DeleteDeliveryMethodAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }
}

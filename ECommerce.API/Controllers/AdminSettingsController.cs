using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
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
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;

    public AdminSettingsController(IAdminSettingsService settingsService, IWebHostEnvironment environment, IConfiguration config)
    {
        _settingsService = settingsService;
        _environment = environment;
        _config = config;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<SiteSettingsDto>> GetSettings()
    {
        var settings = await _settingsService.GetSettingsAsync();
        return Ok(settings);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost]
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

        var externalPath = _config["ExternalMediaPath"] ?? Path.Combine(Directory.GetParent(_environment.ContentRootPath)!.FullName, "ArzaMedia");
        var uploadsFolder = Path.Combine(externalPath, "settings");
        Directory.CreateDirectory(uploadsFolder);

        var fileExtension = Path.GetExtension(file.FileName);
        var fileName = $"logo_{DateTime.UtcNow.Ticks}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new UploadResultDto { Url = $"/uploads/settings/{fileName}" });
    }

    [HttpGet("delivery-methods")]
    public async Task<ActionResult<IEnumerable<DeliveryMethod>>> GetDeliveryMethods()
    {
        return Ok(await _settingsService.GetDeliveryMethodsAsync());
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("delivery-methods")]
    public async Task<ActionResult<DeliveryMethod>> CreateDeliveryMethod([FromBody] DeliveryMethodDto dto)
    {
        var method = await _settingsService.CreateDeliveryMethodAsync(dto);
        return CreatedAtAction(nameof(GetDeliveryMethods), new { id = method.Id }, method);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("delivery-methods/{id}")]
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

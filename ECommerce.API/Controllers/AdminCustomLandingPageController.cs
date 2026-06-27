using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("products")]
[ApiController]
[Route("api/admin/custom-landing-page")]
public class AdminCustomLandingPageController : ControllerBase
{
    private readonly IAdminCustomLandingPageService _landingPageService;

    public AdminCustomLandingPageController(IAdminCustomLandingPageService landingPageService)
    {
        _landingPageService = landingPageService;
    }

    [HttpGet("{productId}")]
    public async Task<ActionResult<CustomLandingPageConfigDto?>> GetConfig(int productId)
    {
        var config = await _landingPageService.GetConfigAsync(productId);

        if (config == null)
        {
            return Ok(null);
        }

        return Ok(config);
    }

    [HttpPut]
    public async Task<ActionResult<CustomLandingPageConfigDto>> SaveConfig(CustomLandingPageConfigUpdateDto updateDto)
    {
        Serilog.Log.Information($"[SAVE CONFIG DEBUG] ProductId: {updateDto.ProductId}, Mins: {updateDto.RelativeTimerTotalMinutes}, SectionsJson: {updateDto.SectionsJson}");
        var result = await _landingPageService.SaveConfigAsync(updateDto);
        return Ok(result);
    }
}

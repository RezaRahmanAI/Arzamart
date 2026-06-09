using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/custom-landing-page")]
public class CustomLandingPageController : ControllerBase
{
    private readonly ICustomLandingPageService _customLandingPageService;

    public CustomLandingPageController(ICustomLandingPageService customLandingPageService)
    {
        _customLandingPageService = customLandingPageService;
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<CustomLandingPageDataDto>> GetData(string slug)
    {
        var result = await _customLandingPageService.GetDataAsync(slug);

        if (result == null)
            return NotFound(new { message = "Resource not found: Product does not exist or is inactive." });

        return Ok(result);
    }
}

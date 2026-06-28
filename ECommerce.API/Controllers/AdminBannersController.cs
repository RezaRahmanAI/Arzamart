using ECommerce.API.Helpers;
using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/banners")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("banners")]
public class AdminBannersController : ControllerBase
{
    private readonly IAdminBannerService _bannerService;
    private readonly IFileUploadService _fileUploadService;

    public AdminBannersController(IAdminBannerService bannerService, IFileUploadService fileUploadService)
    {
        _bannerService = bannerService;
        _fileUploadService = fileUploadService;
    }

    [HttpGet]
    public async Task<ActionResult<List<HeroBannerDto>>> GetAllBanners()
    {
        return Ok(await _bannerService.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HeroBannerDto>> GetBannerById(int id)
    {
        var result = await _bannerService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<HeroBannerDto>> CreateBanner([FromBody] CreateHeroBannerDto dto)
    {
        var result = await _bannerService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetBannerById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<HeroBannerDto>> UpdateBanner(int id, [FromBody] CreateHeroBannerDto dto)
    {
        try
        {
            var result = await _bannerService.UpdateAsync(id, dto);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> DeleteBanner(int id)
    {
        try
        {
            await _bannerService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [HttpPost("image")]
    public async Task<ActionResult<UploadResultDto>> UploadImage(IFormFile file)
    {
        try
        {
            var url = await _fileUploadService.UploadAsync(file, "banners");
            return Ok(new UploadResultDto { Url = url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during banner image upload." });
        }
    }
}

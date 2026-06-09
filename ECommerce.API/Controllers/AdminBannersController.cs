using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.API.Helpers;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/banners")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("banners")]
public class AdminBannersController : ControllerBase
{
    private readonly IAdminBannerService _bannerService;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;
    private readonly IMemoryCache _cache;
    private readonly IOutputCacheStore _cacheStore;

    public AdminBannersController(IAdminBannerService bannerService, IWebHostEnvironment environment, IConfiguration config, IMemoryCache cache, IOutputCacheStore cacheStore)
    {
        _bannerService = bannerService;
        _environment = environment;
        _config = config;
        _cache = cache;
        _cacheStore = cacheStore;
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

        _cache.Remove("home_banners");
        _cache.Remove("banners_active");
        await _cacheStore.EvictByTagAsync("home", default);

        return CreatedAtAction(nameof(GetBannerById), new { id = result.Id }, result);
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<HeroBannerDto>> UpdateBanner(int id, [FromBody] CreateHeroBannerDto dto)
    {
        try
        {
            var result = await _bannerService.UpdateAsync(id, dto);

            _cache.Remove("home_banners");
            _cache.Remove("banners_active");
            await _cacheStore.EvictByTagAsync("home", default);

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

            _cache.Remove("home_banners");
            _cache.Remove("banners_active");
            await _cacheStore.EvictByTagAsync("home", default);

            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [HttpPost("image")]
    public async Task<ActionResult<UploadResultDto>> UploadImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var uploadsFolder = PathHelper.GetUploadsFolder(_config, _environment, "banners");

        var fileExtension = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new UploadResultDto { Url = $"/uploads/banners/{fileName}" });
    }
}

using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/banners")]
[Authorize(Roles = "Admin")]
public class AdminBannersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;

    public AdminBannersController(ApplicationDbContext context, IWebHostEnvironment environment, IConfiguration config)
    {
        _context = context;
        _environment = environment;
        _config = config;
    }

    [HttpGet]
    public async Task<ActionResult<List<HeroBannerDto>>> GetAllBanners()
    {
        var banners = await _context.HeroBanners
            .AsNoTracking()
            .OrderBy(b => b.DisplayOrder)
            .Select(b => new HeroBannerDto
            {
                Id = b.Id,
                Title = b.Title ?? "",
                Subtitle = b.Subtitle ?? "",
                ImageUrl = b.ImageUrl,
                MobileImageUrl = b.MobileImageUrl ?? "",
                LinkUrl = b.LinkUrl ?? "",
                ButtonText = b.ButtonText ?? "",
                DisplayOrder = b.DisplayOrder
            })
            .ToListAsync();

        return Ok(banners);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HeroBannerDto>> GetBannerById(int id)
    {
        var banner = await _context.HeroBanners.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (banner == null) return NotFound();

        return Ok(new HeroBannerDto
        {
            Id = banner.Id,
            Title = banner.Title ?? "",
            Subtitle = banner.Subtitle ?? "",
            ImageUrl = banner.ImageUrl,
            MobileImageUrl = banner.MobileImageUrl ?? "",
            LinkUrl = banner.LinkUrl ?? "",
            ButtonText = banner.ButtonText ?? "",
            DisplayOrder = banner.DisplayOrder
        });
    }

    [HttpPost]
    public async Task<ActionResult<HeroBannerDto>> CreateBanner([FromBody] CreateHeroBannerDto dto)
    {
        var banner = new HeroBanner
        {
            Title = dto.Title,
            Subtitle = dto.Subtitle,
            ImageUrl = dto.ImageUrl,
            MobileImageUrl = dto.MobileImageUrl,
            LinkUrl = dto.LinkUrl,
            ButtonText = dto.ButtonText,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive
        };

        _context.HeroBanners.Add(banner);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBannerById), new { id = banner.Id }, new HeroBannerDto
        {
            Id = banner.Id,
            Title = banner.Title ?? "",
            Subtitle = banner.Subtitle ?? "",
            ImageUrl = banner.ImageUrl,
            MobileImageUrl = banner.MobileImageUrl ?? "",
            LinkUrl = banner.LinkUrl ?? "",
            ButtonText = banner.ButtonText ?? "",
            DisplayOrder = banner.DisplayOrder
        });
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<HeroBannerDto>> UpdateBanner(int id, [FromBody] CreateHeroBannerDto dto)
    {
        var banner = await _context.HeroBanners.FindAsync(id);
        if (banner == null) return NotFound();

        banner.Title = dto.Title;
        banner.Subtitle = dto.Subtitle;
        banner.ImageUrl = dto.ImageUrl;
        banner.MobileImageUrl = dto.MobileImageUrl;
        banner.LinkUrl = dto.LinkUrl;
        banner.ButtonText = dto.ButtonText;
        banner.DisplayOrder = dto.DisplayOrder;
        banner.IsActive = dto.IsActive;
        banner.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new HeroBannerDto
        {
            Id = banner.Id,
            Title = banner.Title ?? "",
            Subtitle = banner.Subtitle ?? "",
            ImageUrl = banner.ImageUrl,
            MobileImageUrl = banner.MobileImageUrl ?? "",
            LinkUrl = banner.LinkUrl ?? "",
            ButtonText = banner.ButtonText ?? "",
            DisplayOrder = banner.DisplayOrder
        });
    }

    [HttpPost("{id}/delete")]
    public async Task<ActionResult> DeleteBanner(int id)
    {
        var banner = await _context.HeroBanners.FindAsync(id);
        if (banner == null) return NotFound();

        _context.HeroBanners.Remove(banner);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("image")]
    public async Task<ActionResult<object>> UploadImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var externalPath = _config["ExternalMediaPath"] ?? Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
        var uploadsFolder = Path.Combine(externalPath, "banners");
        Directory.CreateDirectory(uploadsFolder);

        var fileExtension = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { url = $"/uploads/banners/{fileName}" });
    }
}

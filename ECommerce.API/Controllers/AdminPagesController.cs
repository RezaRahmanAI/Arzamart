using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/pages")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminPagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly Microsoft.AspNetCore.OutputCaching.IOutputCacheStore _cacheStore;

    public AdminPagesController(ApplicationDbContext context, Microsoft.AspNetCore.OutputCaching.IOutputCacheStore cacheStore)
    {
        _context = context;
        _cacheStore = cacheStore;
    }

    [HttpGet]
    public async Task<ActionResult<List<PageDto>>> GetAllPages()
    {
        var pages = await _context.Pages
            .AsNoTracking()
            .Select(p => new PageDto
            {
                Id = p.Id,
                Title = p.Title,
                Slug = p.Slug,
                Content = p.Content ?? "",
                MetaTitle = p.MetaTitle ?? "",
                MetaDescription = p.MetaDescription ?? "",
                IsActive = p.IsActive
            })
            .ToListAsync();

        return Ok(pages);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PageDto>> GetPageById(int id)
    {
        var page = await _context.Pages.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (page == null) return NotFound();

        return Ok(new PageDto
        {
            Id = page.Id,
            Title = page.Title,
            Slug = page.Slug,
            Content = page.Content ?? "",
            MetaTitle = page.MetaTitle ?? "",
            MetaDescription = page.MetaDescription ?? "",
            IsActive = page.IsActive
        });
    }

    [HttpPost]
    public async Task<ActionResult<PageDto>> CreatePage([FromBody] PageCreateDto dto)
    {
        var page = new Page
        {
            Title = dto.Title,
            Slug = dto.Slug,
            Content = dto.Content,
            MetaTitle = dto.MetaTitle,
            MetaDescription = dto.MetaDescription,
            IsActive = dto.IsActive
        };

        _context.Pages.Add(page);
        await _context.SaveChangesAsync();

        await _cacheStore.EvictByTagAsync("content", default);

        return CreatedAtAction(nameof(GetPageById), new { id = page.Id }, new PageDto
        {
            Id = page.Id,
            Title = page.Title,
            Slug = page.Slug,
            Content = page.Content ?? "",
            MetaTitle = page.MetaTitle ?? "",
            MetaDescription = page.MetaDescription ?? "",
            IsActive = page.IsActive
        });
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<PageDto>> UpdatePage(int id, [FromBody] PageCreateDto dto)
    {
        var page = await _context.Pages.FindAsync(id);
        if (page == null) return NotFound();

        page.Title = dto.Title;
        page.Slug = dto.Slug;
        page.Content = dto.Content;
        page.MetaTitle = dto.MetaTitle;
        page.MetaDescription = dto.MetaDescription;
        page.IsActive = dto.IsActive;
        page.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _cacheStore.EvictByTagAsync("content", default);

        return Ok(new PageDto
        {
            Id = page.Id,
            Title = page.Title,
            Slug = page.Slug,
            Content = page.Content ?? "",
            MetaTitle = page.MetaTitle ?? "",
            MetaDescription = page.MetaDescription ?? "",
            IsActive = page.IsActive
        });
    }

    [HttpPost("{id}/delete")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> DeletePage(int id)
    {
        var page = await _context.Pages.FindAsync(id);
        if (page == null) return NotFound();

        _context.Pages.Remove(page);
        await _context.SaveChangesAsync();

        await _cacheStore.EvictByTagAsync("content", default);

        return NoContent();
    }
}

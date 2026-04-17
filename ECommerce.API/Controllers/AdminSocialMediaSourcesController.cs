using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/social-media-sources")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminSocialMediaSourcesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminSocialMediaSourcesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<SocialMediaSourceDto>>> GetAll()
    {
        var items = await _context.SocialMediaSources
            .Select(p => new SocialMediaSourceDto
            {
                Id = p.Id,
                Name = p.Name,
                IsActive = p.IsActive
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<ActionResult<List<SocialMediaSourceDto>>> GetActive()
    {
        var items = await _context.SocialMediaSources
            .Where(p => p.IsActive)
            .Select(p => new SocialMediaSourceDto
            {
                Id = p.Id,
                Name = p.Name,
                IsActive = p.IsActive
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SocialMediaSourceDto>> GetById(int id)
    {
        var item = await _context.SocialMediaSources.FindAsync(id);
        if (item == null) return NotFound();

        return Ok(new SocialMediaSourceDto
        {
            Id = item.Id,
            Name = item.Name,
            IsActive = item.IsActive
        });
    }

    [HttpPost]
    public async Task<ActionResult<SocialMediaSourceDto>> Create([FromBody] SocialMediaSourceCreateDto dto)
    {
        var item = new SocialMediaSource
        {
            Name = dto.Name,
            IsActive = dto.IsActive
        };

        _context.SocialMediaSources.Add(item);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, new SocialMediaSourceDto
        {
            Id = item.Id,
            Name = item.Name,
            IsActive = item.IsActive
        });
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<SocialMediaSourceDto>> Update(int id, [FromBody] SocialMediaSourceCreateDto dto)
    {
        var item = await _context.SocialMediaSources.FindAsync(id);
        if (item == null) return NotFound();

        item.Name = dto.Name;
        item.IsActive = dto.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new SocialMediaSourceDto
        {
            Id = item.Id,
            Name = item.Name,
            IsActive = item.IsActive
        });
    }

    [HttpPost("{id}/delete")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> Delete(int id)
    {
        var item = await _context.SocialMediaSources.FindAsync(id);
        if (item == null) return NotFound();

        _context.SocialMediaSources.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

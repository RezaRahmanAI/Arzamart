using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/source-pages")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminSourcePagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminSourcePagesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<SourcePageDto>>> GetAll()
    {
        var items = await _context.SourcePages
            .Select(p => new SourcePageDto
            {
                Id = p.Id,
                Name = p.Name,
                IsActive = p.IsActive
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("active")]
    [AllowAnonymous] // Or allow for authorized users who can create orders
    public async Task<ActionResult<List<SourcePageDto>>> GetActive()
    {
        var items = await _context.SourcePages
            .Where(p => p.IsActive)
            .Select(p => new SourcePageDto
            {
                Id = p.Id,
                Name = p.Name,
                IsActive = p.IsActive
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SourcePageDto>> GetById(int id)
    {
        var item = await _context.SourcePages.FindAsync(id);
        if (item == null) return NotFound();

        return Ok(new SourcePageDto
        {
            Id = item.Id,
            Name = item.Name,
            IsActive = item.IsActive
        });
    }

    [HttpPost]
    public async Task<ActionResult<SourcePageDto>> Create([FromBody] SourcePageCreateDto dto)
    {
        var item = new SourcePage
        {
            Name = dto.Name,
            IsActive = dto.IsActive
        };

        _context.SourcePages.Add(item);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, new SourcePageDto
        {
            Id = item.Id,
            Name = item.Name,
            IsActive = item.IsActive
        });
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<SourcePageDto>> Update(int id, [FromBody] SourcePageCreateDto dto)
    {
        var item = await _context.SourcePages.FindAsync(id);
        if (item == null) return NotFound();

        item.Name = dto.Name;
        item.IsActive = dto.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new SourcePageDto
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
        var item = await _context.SourcePages.FindAsync(id);
        if (item == null) return NotFound();

        _context.SourcePages.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

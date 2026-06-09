using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/pages")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("pages")]
public class AdminPagesController : ControllerBase
{
    private readonly IAdminPageService _pageService;
    private readonly IOutputCacheStore _cacheStore;

    public AdminPagesController(IAdminPageService pageService, IOutputCacheStore cacheStore)
    {
        _pageService = pageService;
        _cacheStore = cacheStore;
    }

    [HttpGet]
    public async Task<ActionResult<List<PageDto>>> GetAllPages()
    {
        return Ok(await _pageService.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PageDto>> GetPageById(int id)
    {
        var result = await _pageService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<PageDto>> CreatePage([FromBody] PageCreateDto dto)
    {
        var result = await _pageService.CreateAsync(dto);
        await _cacheStore.EvictByTagAsync("content", default);
        return CreatedAtAction(nameof(GetPageById), new { id = result.Id }, result);
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<PageDto>> UpdatePage(int id, [FromBody] PageCreateDto dto)
    {
        try
        {
            var result = await _pageService.UpdateAsync(id, dto);
            await _cacheStore.EvictByTagAsync("content", default);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> DeletePage(int id)
    {
        try
        {
            await _pageService.DeleteAsync(id);
            await _cacheStore.EvictByTagAsync("content", default);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }
}

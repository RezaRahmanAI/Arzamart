using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/social-media-sources")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("order-sources")]
public class AdminSocialMediaSourcesController : ControllerBase
{
    private readonly IAdminSocialMediaSourceService _socialMediaSourceService;

    public AdminSocialMediaSourcesController(IAdminSocialMediaSourceService socialMediaSourceService)
    {
        _socialMediaSourceService = socialMediaSourceService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SocialMediaSourceDto>>> GetAll()
    {
        var items = await _socialMediaSourceService.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<ActionResult<List<SocialMediaSourceDto>>> GetActive()
    {
        var items = await _socialMediaSourceService.GetActiveAsync();
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SocialMediaSourceDto>> GetById(int id)
    {
        var item = await _socialMediaSourceService.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<SocialMediaSourceDto>> Create([FromBody] SocialMediaSourceCreateDto dto)
    {
        var result = await _socialMediaSourceService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<SocialMediaSourceDto>> Update(int id, [FromBody] SocialMediaSourceCreateDto dto)
    {
        try
        {
            var result = await _socialMediaSourceService.UpdateAsync(id, dto);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/delete")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            await _socialMediaSourceService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }
}

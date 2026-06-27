using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/source-pages")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("order-sources")]
public class AdminSourcePagesController : ControllerBase
{
    private readonly IAdminSourcePageService _sourcePageService;

    public AdminSourcePagesController(IAdminSourcePageService sourcePageService)
    {
        _sourcePageService = sourcePageService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SourcePageDto>>> GetAll()
    {
        var items = await _sourcePageService.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<ActionResult<List<SourcePageDto>>> GetActive()
    {
        var items = await _sourcePageService.GetActiveAsync();
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SourcePageDto>> GetById(int id)
    {
        var item = await _sourcePageService.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<SourcePageDto>> Create([FromBody] SourcePageCreateDto dto)
    {
        var result = await _sourcePageService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SourcePageDto>> Update(int id, [FromBody] SourcePageCreateDto dto)
    {
        try
        {
            var result = await _sourcePageService.UpdateAsync(id, dto);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            await _sourcePageService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }
}

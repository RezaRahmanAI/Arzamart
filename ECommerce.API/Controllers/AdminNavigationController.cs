using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/navigation")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("navigation")]
public class AdminNavigationController : ControllerBase
{
    private readonly IAdminNavigationService _navigationService;
    private readonly IOutputCacheStore _cacheStore;

    public AdminNavigationController(IAdminNavigationService navigationService, IOutputCacheStore cacheStore)
    {
        _navigationService = navigationService;
        _cacheStore = cacheStore;
    }

    [HttpGet]
    public async Task<ActionResult<List<NavigationMenuDto>>> GetAllMenus()
    {
        var menus = await _navigationService.GetAllAsync();
        return Ok(menus);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NavigationMenuDto>> GetMenuById(int id)
    {
        var menu = await _navigationService.GetByIdAsync(id);
        if (menu == null) return NotFound();
        return Ok(menu);
    }

    [HttpPost]
    public async Task<ActionResult<NavigationMenuDto>> CreateMenu([FromBody] NavigationMenuCreateDto dto)
    {
        var result = await _navigationService.CreateAsync(dto);
        await _cacheStore.EvictByTagAsync("config", default);
        return CreatedAtAction(nameof(GetMenuById), new { id = result.Id }, result);
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<NavigationMenuDto>> UpdateMenu(int id, [FromBody] NavigationMenuCreateDto dto)
    {
        try
        {
            var result = await _navigationService.UpdateAsync(id, dto);
            await _cacheStore.EvictByTagAsync("config", default);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> DeleteMenu(int id)
    {
        try
        {
            await _navigationService.DeleteAsync(id);
            await _cacheStore.EvictByTagAsync("config", default);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }
}

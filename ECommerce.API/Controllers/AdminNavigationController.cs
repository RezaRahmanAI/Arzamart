using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/navigation")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("navigation")]
public class AdminNavigationController : ControllerBase
{
    private readonly IAdminNavigationService _navigationService;

    public AdminNavigationController(IAdminNavigationService navigationService)
    {
        _navigationService = navigationService;
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
        return CreatedAtAction(nameof(GetMenuById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<NavigationMenuDto>> UpdateMenu(int id, [FromBody] NavigationMenuCreateDto dto)
    {
        try
        {
            var result = await _navigationService.UpdateAsync(id, dto);
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
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }
}

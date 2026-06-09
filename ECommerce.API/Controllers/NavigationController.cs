using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

public class NavigationController : BaseApiController
{
    private readonly INavigationService _navigationService;

    public NavigationController(INavigationService navigationService)
    {
        _navigationService = navigationService;
    }

    [HttpGet("mega-menu")]
    public async Task<IActionResult> GetMegaMenu()
    {
        var menu = await _navigationService.GetMegaMenuAsync();
        return Ok(menu);
    }
}

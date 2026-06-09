using ECommerce.Core.DTOs;
using ECommerce.Infrastructure.Cache;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HomeController : ControllerBase
{
    private readonly AppCache _cache;

    public HomeController(AppCache cache)
    {
        _cache = cache;
    }

    [HttpGet]
    public IActionResult GetHomeData()
    {
        if (_cache.HomePageData.TryGetValue("homepage", out var homeDto))
            return Ok(homeDto);

        return Ok(new HomePageDto
        {
            Banners = new List<HeroBannerDto>(),
            NewArrivals = new List<ProductListDto>(),
            FeaturedProducts = new List<ProductListDto>(),
            Categories = new List<CategoryDto>()
        });
    }

    [HttpGet("hero")]
    public IActionResult GetHeroData()
    {
        if (_cache.HomePageData.TryGetValue("homepage", out var homeDto))
            return Ok(homeDto.Banners);

        return Ok(new List<HeroBannerDto>());
    }

    [HttpGet("products")]
    public IActionResult GetNewArrivals()
    {
        if (_cache.HomePageData.TryGetValue("homepage", out var homeDto))
            return Ok(homeDto.NewArrivals);

        return Ok(new List<ProductListDto>());
    }
}

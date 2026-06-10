using ECommerce.Core.DTOs;
using ECommerce.Infrastructure.Cache;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/banners")]
public class BannersController : ControllerBase
{
    private readonly AppCache _cache;

    public BannersController(AppCache cache)
    {
        _cache = cache;
    }

    [HttpGet]
    public ActionResult<List<HeroBannerDto>> GetActiveBanners()
    {
        var bannerDtos = _cache.Banners.Values
            .Where(b => b.IsActive)
            .OrderBy(b => b.DisplayOrder)
            .Select(b => new HeroBannerDto
            {
                Id = b.Id,
                Title = b.Title ?? "",
                Subtitle = b.Subtitle ?? "",
                ImageUrl = b.ImageUrl,
                MobileImageUrl = b.MobileImageUrl ?? "",
                LinkUrl = b.LinkUrl ?? "",
                ButtonText = b.ButtonText ?? "",
                DisplayOrder = b.DisplayOrder,
                Type = b.Type
            }).ToList();

        return Ok(bannerDtos);
    }
}

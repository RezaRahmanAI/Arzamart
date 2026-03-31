using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/banners")]
public class BannersController : ControllerBase
{
    private readonly IGenericRepository<HeroBanner> _bannerRepo;
    private readonly IMemoryCache _cache;

    public BannersController(IGenericRepository<HeroBanner> bannerRepo, IMemoryCache cache)
    {
        _bannerRepo = bannerRepo;
        _cache = cache;
    }

    [HttpGet]
    [ResponseCache(Duration = 300)]
    public async Task<ActionResult<List<HeroBannerDto>>> GetActiveBanners()
    {
        const string cacheKey = "banners_active";

        if (_cache.TryGetValue(cacheKey, out List<HeroBannerDto>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var spec = new HeroBannerSpecification(isActive: true);
        var banners = await _bannerRepo.ListAsync(spec);

        var bannerDtos = banners.Select(b => new HeroBannerDto
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

        _cache.Set(cacheKey, bannerDtos, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
        return Ok(bannerDtos);
    }
}

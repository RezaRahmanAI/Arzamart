using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Specifications;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/banners")]
public class BannersController : ControllerBase
{
    private readonly IGenericRepository<HeroBanner> _bannerRepo;

    public BannersController(IGenericRepository<HeroBanner> bannerRepo)
    {
        _bannerRepo = bannerRepo;
    }

    [HttpGet]
    public async Task<ActionResult<List<HeroBannerDto>>> GetActiveBanners()
    {
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

        return Ok(bannerDtos);
    }
}

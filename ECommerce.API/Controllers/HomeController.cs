using AutoMapper;
using ECommerce.Core.Constants;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.OutputCaching.OutputCache(Tags = new[] { "home" })]
public class HomeController : ControllerBase
{
    private readonly IGenericRepository<HeroBanner> _bannerRepo;
    private readonly IGenericRepository<Product> _productRepo;
    private readonly IGenericRepository<Category> _categoryRepo;

    private readonly IMapper _mapper;
    private readonly IMemoryCache _cache;
    private readonly IProductService _productService;

    public HomeController(
        IGenericRepository<HeroBanner> bannerRepo,
        IGenericRepository<Product> productRepo,
        IGenericRepository<Category> categoryRepo,

        IMapper mapper,
        IMemoryCache cache,
        IProductService productService)
    {
        _bannerRepo = bannerRepo;
        _productRepo = productRepo;
        _categoryRepo = categoryRepo;

        _mapper = mapper;
        _cache = cache;
        _productService = productService;
    }

    [HttpGet]
    [Microsoft.AspNetCore.OutputCaching.OutputCache(Duration = 600)]
    public async Task<ActionResult<HomePageDto>> GetHomeData()
    {
        // 1. Banners (home_banners)
        var banners = await _cache.GetOrCreateAsync("home_banners", async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromMinutes(30);
            var items = await _bannerRepo.ListAsync(new HeroBannerSpecification(isActive: true));
            return items.Select(b => new HeroBannerDto
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
        });

        // 2. New Arrivals (home_new_arrivals)
        var newArrivals = await _cache.GetOrCreateAsync("home_new_arrivals", async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromMinutes(10);
            var items = await _productRepo.ListAsync(new ProductsWithCategoriesSpecification(
                sort: "id_desc", categoryId: null, subCategoryId: null, collectionId: null,
                categorySlug: null, subCategorySlug: null, collectionSlug: null, search: null,
                tier: null, tags: null, isNew: true, isFeatured: null, skip: 0, take: 50));
            return _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductListDto>>(items);
        });

        // 3. Featured Products (home_featured_products)
        var featuredProducts = await _cache.GetOrCreateAsync("home_featured_products", async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromMinutes(10);
            var items = await _productRepo.ListAsync(new ProductsWithCategoriesSpecification(
                sort: "id_desc", categoryId: null, subCategoryId: null, collectionId: null,
                categorySlug: null, subCategorySlug: null, collectionSlug: null, search: null,
                tier: null, tags: null, isNew: null, isFeatured: true, skip: 0, take: 10));
            return _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductListDto>>(items);
        });

        // 4. Categories (home_categories)
        var categories = await _cache.GetOrCreateAsync("home_categories", async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromHours(1);
            var items = await _categoryRepo.ListAsync(new BaseSpecification<Category>(c => c.IsActive));
            return _mapper.Map<IReadOnlyList<Category>, IReadOnlyList<CategoryDto>>(items);
        });


        return Ok(new HomePageDto
        {
            Banners = banners ?? new List<HeroBannerDto>(),
            NewArrivals = newArrivals ?? new List<ProductListDto>(),
            FeaturedProducts = featuredProducts ?? new List<ProductListDto>(),
            Categories = categories ?? new List<CategoryDto>()
        });
    }
}

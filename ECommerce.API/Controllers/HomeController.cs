using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
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
    [ResponseCache(Duration = 600)]
    public async Task<ActionResult<HomePageDto>> GetHomeData()
    {
        const string cacheKey = "home_page_data";

        if (_cache.TryGetValue(cacheKey, out HomePageDto? cached) && cached != null)
        {
            return Ok(cached);
        }

        // EF Core DbContext is not thread-safe and does not support parallel queries on the same instance.
        // We must execute them sequentially.
        var banners = await _bannerRepo.ListAsync(new HeroBannerSpecification(isActive: true));
        var newArrivals = await _productRepo.ListAsync(new ProductsWithCategoriesSpecification(
            sort: "id_desc", categoryId: null, subCategoryId: null, collectionId: null,
            categorySlug: null, subCategorySlug: null, collectionSlug: null, search: null,
            tier: null, tags: null, isNew: true, isFeatured: null, skip: 0, take: 10));
        var featuredProducts = await _productRepo.ListAsync(new ProductsWithCategoriesSpecification(
            sort: "id_desc", categoryId: null, subCategoryId: null, collectionId: null,
            categorySlug: null, subCategorySlug: null, collectionSlug: null, search: null,
            tier: null, tags: null, isNew: null, isFeatured: true, skip: 0, take: 10));
        var categories = await _categoryRepo.ListAsync(new CategoriesWithSubCategoriesSpec());

        var bannerDtos = banners.Select(b => new HeroBannerDto
        {
            Id = b.Id,
            Title = b.Title ?? "",
            Subtitle = b.Subtitle ?? "",
            ImageUrl = b.ImageUrl,
            MobileImageUrl = b.MobileImageUrl ?? "",
            LinkUrl = b.LinkUrl ?? "",
            ButtonText = b.ButtonText ?? "",
            DisplayOrder = b.DisplayOrder
        }).ToList();

        var newArrivalsDtos = _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductListDto>>(newArrivals);
        var featuredDtos = _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductListDto>>(featuredProducts);
        var categoryDtos = _mapper.Map<IReadOnlyList<CategoryDto>>(categories);

        var result = new HomePageDto
        {
            Banners = bannerDtos,
            NewArrivals = newArrivalsDtos,
            FeaturedProducts = featuredDtos,
            Categories = categoryDtos
        };

        _cache.Set(cacheKey, result, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });

        return Ok(result);
    }
}

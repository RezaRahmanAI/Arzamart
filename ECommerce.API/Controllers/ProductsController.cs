using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Linq;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.OutputCaching.OutputCache(Tags = new[] { "catalog" })]
public class ProductsController : ControllerBase
{
    private readonly IGenericRepository<Product> _productsRepo;
    private readonly IGenericRepository<Category> _categoriesRepo;

    private readonly IMapper _mapper;
    private readonly IProductService _productService;
    private readonly IMemoryCache _cache;

    public ProductsController(
        IGenericRepository<Product> productsRepo, 
        IGenericRepository<Category> categoriesRepo,
        IMapper mapper,
        IProductService productService,
        IMemoryCache cache)
    {
        _productsRepo = productsRepo;
        _categoriesRepo = categoriesRepo;
        _mapper = mapper;
        _productService = productService;
        _cache = cache;
    }

    [HttpGet]
    [ResponseCache(Duration = 300, VaryByQueryKeys = new[] { "*" })]
    [Microsoft.AspNetCore.OutputCaching.OutputCache(PolicyName = "Products")]
    public async Task<ActionResult<PaginationDto<ProductListDto>>> GetProducts(
        [FromQuery] string? sort, 
        [FromQuery] int? categoryId, 
        [FromQuery] int? subCategoryId, 
        [FromQuery] int? collectionId, 
        [FromQuery] string? categorySlug, 
        [FromQuery] string? subCategorySlug, 
        [FromQuery] string? collectionSlug, 
        [FromQuery] string? searchTerm, 
        [FromQuery] string? tier, 
        [FromQuery] string? tags, 
        [FromQuery] bool? isNew, 
        [FromQuery] bool? isFeatured,
        [FromQuery] int? productGroupId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 12)
    {
        // Build a deterministic cache key from all query parameters
        var cacheKey = $"products_{sort}_{categoryId}_{subCategoryId}_{collectionId}_{categorySlug}_{subCategorySlug}_{collectionSlug}_{searchTerm}_{tier}_{tags}_{isNew}_{isFeatured}_{pageIndex}_{pageSize}_{productGroupId}";

        if (_cache.TryGetValue(cacheKey, out PaginationDto<ProductListDto>? cached) && cached != null)
        {
            return Ok(cached);
        }

        // Map categorySlug to categoryId if not provided
        if (!categoryId.HasValue && !string.IsNullOrEmpty(categorySlug))
        {
            var dbCat = await _categoriesRepo.GetEntityWithSpec(new BaseSpecification<Category>(c => c.Slug == categorySlug));
            if (dbCat != null)
            {
                categoryId = dbCat.Id;
            }
            else
            {
                categoryId = -1;
            }
        }

        var skip = (pageIndex - 1) * pageSize;
        var take = pageSize;

        var spec = new ProductsWithCategoriesSpecification(sort, categoryId, subCategoryId, collectionId, categorySlug, subCategorySlug, collectionSlug, searchTerm, tier, tags, isNew, isFeatured, skip, take, productGroupId);
        var countSpec = new ProductsWithCategoriesSpecification(sort, categoryId, subCategoryId, collectionId, categorySlug, subCategorySlug, collectionSlug, searchTerm, tier, tags, isNew, isFeatured, null, null, productGroupId);

        var totalItems = await _productsRepo.CountAsync(countSpec);
        var products = await _productsRepo.ListAsync(spec);
        var dtos = _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductListDto>>(products);
        
        var result = new PaginationDto<ProductListDto>(pageIndex, pageSize, totalItems, dtos);
        
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetSize(1)
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(5));

        _cache.Set(cacheKey, result, cacheOptions);
        
        return Ok(result);
    }

    [HttpGet("{slug}")]
    [ResponseCache(Duration = 300, VaryByQueryKeys = new[] { "slug" })]
    [Microsoft.AspNetCore.OutputCaching.OutputCache(PolicyName = "Products")]
    public async Task<ActionResult<ProductDto>> GetProduct(string slug)
    {
        var cacheKey = $"product_{slug}";

        if (_cache.TryGetValue(cacheKey, out ProductDto? cached) && cached != null)
        {
            return Ok(cached);
        }

        var product = await _productService.GetProductBySlugAsync(slug);
        if (product == null) return NotFound();
        
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetSize(1)
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(5));

        _cache.Set(cacheKey, product, cacheOptions);
        return Ok(product);
    }

}

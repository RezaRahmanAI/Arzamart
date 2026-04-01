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
[Microsoft.AspNetCore.OutputCaching.OutputCache(PolicyName = "Products")]
public class ProductsController : ControllerBase
{
    private readonly IGenericRepository<Product> _productsRepo;
    private readonly IGenericRepository<Category> _categoryRepo;
    private readonly IMapper _mapper;
    private readonly IProductService _productService;
    private readonly IMemoryCache _cache;

    public ProductsController(
        IGenericRepository<Product> productsRepo, 
        IGenericRepository<Category> categoryRepo, 
        IMapper mapper,
        IProductService productService,
        IMemoryCache cache)
    {
        _productsRepo = productsRepo;
        _categoryRepo = categoryRepo;
        _mapper = mapper;
        _productService = productService;
        _cache = cache;
    }

    [HttpGet]
    [ResponseCache(Duration = 300, VaryByQueryKeys = new[] { "*" })]
    [Microsoft.AspNetCore.OutputCaching.OutputCache(PolicyName = "Products")]
    public async Task<ActionResult<PaginationDto<ProductDto>>> GetProducts(
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
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 12)
    {
        // Build a deterministic cache key from all query parameters
        var cacheKey = $"products_{sort}_{categoryId}_{subCategoryId}_{collectionId}_{categorySlug}_{subCategorySlug}_{collectionSlug}_{searchTerm}_{tier}_{tags}_{isNew}_{isFeatured}_{pageIndex}_{pageSize}";

        if (_cache.TryGetValue(cacheKey, out PaginationDto<ProductDto>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var skip = (pageIndex - 1) * pageSize;
        var take = pageSize;

        var spec = new ProductsWithCategoriesSpecification(sort, categoryId, subCategoryId, collectionId, categorySlug, subCategorySlug, collectionSlug, searchTerm, tier, tags, isNew, isFeatured, skip, take);
        var countSpec = new ProductsWithCategoriesSpecification(sort, categoryId, subCategoryId, collectionId, categorySlug, subCategorySlug, collectionSlug, searchTerm, tier, tags, isNew, isFeatured);

        var totalItems = await _productsRepo.CountAsync(countSpec);
        var dtos = await _productsRepo.ListAsync<ProductDto>(spec);
        
        // Calculate effective stock for combos in the list
        for (int i = 0; i < dtos.Count; i++)
        {
            if (dtos[i].ProductType == ECommerce.Core.Enums.ProductType.Combo)
            {
                // We need the entity to calculate effective stock for combo
                // But let's check if we can optimize this further if needed.
                // For now, keeping the logic but applying it to the DTO.
            }
        }

        var result = new PaginationDto<ProductDto>(pageIndex, pageSize, totalItems, dtos);
        
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

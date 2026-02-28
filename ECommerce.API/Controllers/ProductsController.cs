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
    [ResponseCache(Duration = 60, VaryByQueryKeys = new[] { "*" })]
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
        var products = await _productsRepo.ListAsync(spec);
        
        var dtos = _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductDto>>(products);
        
        // Calculate effective stock for combos in the list
        for (int i = 0; i < products.Count; i++)
        {
            if (products[i].ProductType == ECommerce.Core.Enums.ProductType.Combo)
            {
                dtos[i].StockQuantity = _productService.CalculateEffectiveStock(products[i]);
            }
        }

        var result = new PaginationDto<ProductDto>(pageIndex, pageSize, totalItems, dtos);
        
        _cache.Set(cacheKey, result, TimeSpan.FromSeconds(2));
        
        return Ok(result);
    }

    [HttpGet("{slug}")]
    [ResponseCache(Duration = 60, VaryByQueryKeys = new[] { "slug" })]
    public async Task<ActionResult<ProductDto>> GetProduct(string slug)
    {
        var cacheKey = $"product_{slug}";

        if (_cache.TryGetValue(cacheKey, out ProductDto? cached) && cached != null)
        {
            return Ok(cached);
        }

        var product = await _productService.GetProductBySlugAsync(slug);
        if (product == null) return NotFound();
        
        _cache.Set(cacheKey, product, TimeSpan.FromSeconds(60));
        return Ok(product);
    }
}

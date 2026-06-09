using AutoMapper;
using ECommerce.Core.Constants;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Specifications;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Linq;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.OutputCaching.OutputCache(Tags = new[] { "catalog" })]
public class ProductsController : ControllerBase
{
    private readonly IProductQueryService _productQueryService;
    private readonly IProductService _productService;
    private readonly IGenericRepository<Category> _categoriesRepo;
    private readonly IMapper _mapper;
    private readonly IMemoryCache _cache;

    public ProductsController(
        IProductQueryService productQueryService,
        IProductService productService,
        IGenericRepository<Category> categoriesRepo,
        IMapper mapper,
        IMemoryCache cache)
    {
        _productQueryService = productQueryService;
        _productService = productService;
        _categoriesRepo = categoriesRepo;
        _mapper = mapper;
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
        [FromQuery] int? productType,
        [FromQuery] string? ids,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 12)
    {
        // 0. Handle explicit ID list (for manual product curation) - not cached
        if (!string.IsNullOrEmpty(ids))
        {
            var idList = ids.Split(',', StringSplitOptions.RemoveEmptyEntries)
                           .Select(id => int.TryParse(id, out var val) ? val : 0)
                           .Where(v => v > 0)
                           .ToList();

            if (idList.Any())
            {
                var idSpec = new ProductsWithCategoriesSpecification(idList);
                var idProducts = await _productQueryService.GetProductsByIdsAsync(idList);
                
                var idResult = new PaginationDto<ProductListDto>(1, idProducts.Count, idProducts.Count, idProducts);
                return Ok(idResult);
            }
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

        var result = await _productQueryService.GetProductsAsync(
            sort, categoryId, subCategoryId, collectionId, 
            categorySlug, subCategorySlug, collectionSlug,
            searchTerm, tier, tags, isNew, isFeatured,
            pageIndex, pageSize, productGroupId, productType);

        return Ok(result);
    }

    [HttpGet("{slug}")]
    [ResponseCache(Duration = 300, VaryByQueryKeys = new[] { "slug" })]
    [Microsoft.AspNetCore.OutputCaching.OutputCache(PolicyName = "Products")]
    public async Task<ActionResult<ProductDto>> GetProduct(string slug)
    {
        var product = await _productQueryService.GetProductBySlugAsync(slug);
        if (product == null) return NotFound();
        return Ok(product);
    }
}
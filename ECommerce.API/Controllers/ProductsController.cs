using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Cache;
using ECommerce.Infrastructure.Services;
using ECommerce.Infrastructure.Specifications;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductQueryService _productQueryService;
    private readonly AppCache _cache;

    public ProductsController(
        IProductQueryService productQueryService,
        AppCache cache)
    {
        _productQueryService = productQueryService;
        _cache = cache;
    }

    [HttpGet]
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
        [FromQuery] string? gender,
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

        // Map gender query parameter to categorySlug if categorySlug not provided
        if (string.IsNullOrEmpty(categorySlug) && !string.IsNullOrEmpty(gender))
        {
            categorySlug = gender.ToLower() switch
            {
                "men" => "men",
                "women" => "women",
                "kids" or "children" or "childrens" => "children",
                _ => gender.ToLower()
            };
        }

        // Map categorySlug to categoryId if not provided
        if (!categoryId.HasValue && !string.IsNullOrEmpty(categorySlug))
        {
            var dbCat = _cache.Categories.Values.FirstOrDefault(c => 
                c.Slug.Equals(categorySlug, StringComparison.OrdinalIgnoreCase) ||
                (categorySlug == "children" && c.Slug.Equals("kids", StringComparison.OrdinalIgnoreCase)) ||
                (categorySlug == "kids" && c.Slug.Equals("children", StringComparison.OrdinalIgnoreCase))
            );

            if (dbCat != null)
            {
                categoryId = dbCat.Id;
                // Clear categorySlug once categoryId is resolved to prevent double-filtering mismatch in ProductQueryService
                categorySlug = null;
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
    public async Task<ActionResult<ProductDto>> GetProduct(string slug)
    {
        var product = await _productQueryService.GetProductBySlugAsync(slug);
        if (product == null) return NotFound();
        return Ok(product);
    }
}
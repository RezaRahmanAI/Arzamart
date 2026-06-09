using ECommerce.Core.DTOs;
using ECommerce.Core.Constants;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly IPublicCategoryService _publicCategoryService;
    private readonly ICacheService _cache;

    public CategoriesController(IPublicCategoryService publicCategoryService, ICacheService cache)
    {
        _publicCategoryService = publicCategoryService;
        _cache = cache;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var categories = await _cache.GetOrCreateAsync("categories_db_list", async () =>
        {
            return await _publicCategoryService.GetAllActiveAsync();
        }, CacheDurations.Extended);
        return Ok(categories ?? new List<CategoryDto>());
    }

    [HttpGet("nav")]
    public async Task<ActionResult<List<CategoryDto>>> GetNavCategories()
    {
        return await GetCategories();
    }
}

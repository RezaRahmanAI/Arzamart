using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly IPublicCategoryService _publicCategoryService;

    public CategoriesController(IPublicCategoryService publicCategoryService)
    {
        _publicCategoryService = publicCategoryService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var categories = await _publicCategoryService.GetAllActiveAsync();
        return Ok(categories ?? new List<CategoryDto>());
    }

    [HttpGet("nav")]
    public async Task<ActionResult<List<CategoryDto>>> GetNavCategories()
    {
        return await GetCategories();
    }
}

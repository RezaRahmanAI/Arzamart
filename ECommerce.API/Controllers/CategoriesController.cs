using ECommerce.Core.DTOs;
using ECommerce.Core.Constants;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cache;

    public CategoriesController(ApplicationDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        return await _cache.GetOrCreateAsync("categories_db_list", async () =>
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .Where(c => c.IsActive)
                .Include(c => c.SubCategories.Where(sc => sc.IsActive))
                    .ThenInclude(sc => sc.Collections.Where(col => col.IsActive))
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            return categories.Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                ImageUrl = c.ImageUrl,
                IsActive = c.IsActive,
                DisplayOrder = c.DisplayOrder,
                ParentId = c.ParentId,
                SubCategories = c.SubCategories.Select(sc => new SubCategoryDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    Slug = sc.Slug,
                    CategoryId = sc.CategoryId,
                    ImageUrl = sc.ImageUrl,
                    Collections = sc.Collections.Select(col => new CollectionDto
                    {
                        Id = col.Id,
                        Name = col.Name,
                        Slug = col.Slug
                    }).ToList()
                }).ToList()
            }).ToList();
        }, TimeSpan.FromMinutes(60));
    }

    [HttpGet("nav")]
    public async Task<ActionResult<List<CategoryDto>>> GetNavCategories()
    {
        return await GetCategories();
    }
}

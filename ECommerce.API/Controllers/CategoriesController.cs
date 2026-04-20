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
        return await _cache.GetOrCreateAsync("categories_hybrid_list", async () =>
        {
            var categories = CategoryConstants.AllCategories;
            var dbSubCategories = await _context.SubCategories
                .AsNoTracking()
                .Where(sc => sc.IsActive)
                .Include(sc => sc.Collections)
                .ToListAsync();

            foreach (var cat in categories)
            {
                cat.SubCategories = dbSubCategories
                    .Where(sc => sc.CategoryId == cat.Id)
                    .OrderBy(sc => sc.DisplayOrder)
                    .Select(sc => new SubCategoryDto
                    {
                        Id = sc.Id,
                        Name = sc.Name,
                        Slug = sc.Slug,
                        CategoryId = sc.CategoryId,
                        ImageUrl = sc.ImageUrl,
                        Collections = sc.Collections
                            .Where(c => c.IsActive)
                            .Select(c => new CollectionDto
                            {
                                Id = c.Id,
                                Name = c.Name,
                                Slug = c.Slug
                            }).ToList()
                    }).ToList();
            }
            return categories;
        }, TimeSpan.FromMinutes(60));
    }

    [HttpGet("nav")]
    public async Task<ActionResult<List<CategoryDto>>> GetNavCategories()
    {
        // Reuse same logic
        return await GetCategories();
    }
}

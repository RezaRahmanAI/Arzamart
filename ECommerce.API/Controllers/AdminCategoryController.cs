using ECommerce.Core.Interfaces;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Constants;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.API.Helpers;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminCategoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;
    private readonly ICacheService _cache;
    private readonly IOutputCacheStore _cacheStore;

    public AdminCategoryController(
        ApplicationDbContext context, 
        IWebHostEnvironment environment,
        IConfiguration config,
        ICacheService cache,
        IOutputCacheStore cacheStore)
    {
        _context = context;
        _environment = environment;
        _config = config;
        _cache = cache;
        _cacheStore = cacheStore;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAllCategories()
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .Include(c => c.SubCategories)
                .ThenInclude(sc => sc.Collections)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();

        var result = categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            ImageUrl = c.ImageUrl,
            IsActive = c.IsActive,
            DisplayOrder = c.DisplayOrder,
            MetaTitle = c.MetaTitle,
            MetaDescription = c.MetaDescription,
            CreatedAt = c.CreatedAt,
            ParentId = c.ParentId,
            SubCategories = c.SubCategories.Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                CategoryId = sc.CategoryId,
                IsActive = sc.IsActive,
                ImageUrl = sc.ImageUrl,
                DisplayOrder = sc.DisplayOrder,
                Collections = sc.Collections.Select(col => new CollectionDto
                {
                    Id = col.Id,
                    Name = col.Name,
                    Slug = col.Slug
                }).ToList()
            }).ToList()
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetCategoryById(int id)
    {
        var c = await _context.Categories
            .AsNoTracking()
            .Include(c => c.SubCategories)
                .ThenInclude(sc => sc.Collections)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (c == null) return NotFound();

        var result = new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            ImageUrl = c.ImageUrl,
            IsActive = c.IsActive,
            DisplayOrder = c.DisplayOrder,
            MetaTitle = c.MetaTitle,
            MetaDescription = c.MetaDescription,
            CreatedAt = c.CreatedAt,
            ParentId = c.ParentId,
            SubCategories = c.SubCategories.Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                CategoryId = sc.CategoryId,
                IsActive = sc.IsActive,
                ImageUrl = sc.ImageUrl,
                DisplayOrder = sc.DisplayOrder,
                Collections = sc.Collections.Select(col => new CollectionDto
                {
                    Id = col.Id,
                    Name = col.Name,
                    Slug = col.Slug
                }).ToList()
            }).ToList()
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory(CategoryCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Category name is required");

        var slug = string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Name) : dto.Slug;
        
        if (await _context.Categories.AnyAsync(c => c.Slug == slug))
            return BadRequest("A category with this slug already exists");

        var category = new Category
        {
            Name = dto.Name,
            Slug = slug,
            ImageUrl = dto.ImageUrl,
            MetaTitle = dto.MetaTitle,
            MetaDescription = dto.MetaDescription,
            IsActive = dto.IsActive ?? true,
            DisplayOrder = dto.DisplayOrder ?? 0,
            ParentId = dto.ParentId
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        await InvalidateCacheAsync();

        return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, category);
    }

    [HttpPost("{id}")]
    public async Task<IActionResult> UpdateCategory(int id, CategoryUpdateDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            category.Name = dto.Name;
            if (string.IsNullOrWhiteSpace(dto.Slug))
                category.Slug = GenerateSlug(dto.Name);
        }

        if (!string.IsNullOrWhiteSpace(dto.Slug))
        {
            var slug = dto.Slug.ToLower().Replace(" ", "-");
            if (await _context.Categories.AnyAsync(c => c.Slug == slug && c.Id != id))
                return BadRequest("A category with this slug already exists");
            category.Slug = slug;
        }

        category.ImageUrl = dto.ImageUrl;
        category.MetaTitle = dto.MetaTitle;
        category.MetaDescription = dto.MetaDescription;
        category.IsActive = dto.IsActive ?? category.IsActive;
        category.DisplayOrder = dto.DisplayOrder ?? category.DisplayOrder;
        category.ParentId = dto.ParentId;

        await _context.SaveChangesAsync();
        await InvalidateCacheAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.Categories
            .Include(c => c.SubCategories)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null) return NotFound();

        if (category.SubCategories.Any() || category.Products.Any())
            return BadRequest("Cannot delete category that has sub-categories or products. Please delete or move them first.");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        await InvalidateCacheAsync();

        return NoContent();
    }

    [HttpPost("reorder")]
    public async Task<IActionResult> ReorderCategories(List<int> sortedIds)
    {
        if (sortedIds == null || !sortedIds.Any()) return BadRequest("No IDs provided");

        var categories = await _context.Categories.ToListAsync();
        
        for (int i = 0; i < sortedIds.Count; i++)
        {
            var cat = categories.FirstOrDefault(c => c.Id == sortedIds[i]);
            if (cat != null)
            {
                cat.DisplayOrder = i;
            }
        }

        await _context.SaveChangesAsync();
        await InvalidateCacheAsync();

        return NoContent();
    }

    [HttpPost("upload-image")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<ActionResult<object>> UploadImage([FromForm] IFormFile file)
    {
        try 
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var uploadsFolder = PathHelper.GetUploadsFolder(_config, _environment, "categories");
            
            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { url = $"/uploads/categories/{fileName}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during category image upload: " + ex.Message });
        }
    }

    private string GenerateSlug(string name)
    {
        return name.ToLower()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("\"", "")
            .Replace("'", "");
    }

    private async Task InvalidateCacheAsync()
    {
        await _cache.RemoveAsync("nav:mega-menu");
        await _cacheStore.EvictByTagAsync("categories", default);
        await _cacheStore.EvictByTagAsync("catalog", default);
    }
}

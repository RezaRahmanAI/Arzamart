using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.OutputCaching;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin")]
public class AdminCategoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;
    private readonly IMemoryCache _cache;
    private readonly IOutputCacheStore _cacheStore;

    public AdminCategoryController(ApplicationDbContext context, IWebHostEnvironment environment, IConfiguration config, IMemoryCache cache, IOutputCacheStore cacheStore)
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
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                ImageUrl = c.ImageUrl,
                IsActive = c.IsActive,
                DisplayOrder = c.DisplayOrder,
                ProductCount = c.Products.Count,
                ParentId = c.ParentId,
                CreatedAt = c.CreatedAt,
                SubCategories = c.SubCategories.Select(sc => new SubCategoryDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    Slug = sc.Slug,
                    CategoryId = sc.CategoryId,
                    IsActive = sc.IsActive,
                    Collections = sc.Collections.Select(col => new CollectionDto
                    {
                        Id = col.Id,
                        Name = col.Name,
                        Slug = col.Slug,
                        SubCategoryId = col.SubCategoryId,
                        IsActive = col.IsActive
                    }).ToList()
                }).ToList()
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetCategoryById(int id)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return NotFound();

        var dto = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            ImageUrl = category.ImageUrl,
            ProductCount = category.Products.Count,
            ParentId = category.ParentId,
            CreatedAt = category.CreatedAt
        };

        return Ok(dto);
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

            var externalPath = _config["ExternalMediaPath"] ?? Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
            var uploadsFolder = Path.Combine(externalPath, "categories");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { url = $"/uploads/categories/{fileName}" });
        }
        catch (UnauthorizedAccessException ex)
        {
             return StatusCode(403, new { message = "Permission denied: The server process does not have write access to the categories folder. Error: " + ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during image upload: " + ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CategoryCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Category name is required");

        // Generate slug if not provided
        var slug = string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Name) : dto.Slug;

        var category = new Category
        {
            Name = dto.Name,
            Slug = slug,
            ImageUrl = dto.ImageUrl,
            IsActive = dto.IsActive ?? true,
            DisplayOrder = dto.DisplayOrder ?? 0,
            ParentId = dto.ParentId
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        _cache.Remove("home_categories");
        await _cacheStore.EvictByTagAsync("categories", default);

        var result = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            ImageUrl = category.ImageUrl,
            IsActive = category.IsActive,
            DisplayOrder = category.DisplayOrder,
            ProductCount = 0,
            CreatedAt = category.CreatedAt
        };

        return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, result);
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(int id, [FromBody] CategoryUpdateDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Category name is required");

        category.Name = dto.Name;
        category.Slug = string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Name) : dto.Slug;
        category.IsActive = dto.IsActive ?? category.IsActive;
        category.DisplayOrder = dto.DisplayOrder ?? category.DisplayOrder;
        
        // Prevent circular reference
        if (dto.ParentId.HasValue && dto.ParentId != category.Id)
        {
             category.ParentId = dto.ParentId;
        }
        else if (dto.ParentId.HasValue && dto.ParentId == category.Id) 
        {
            return BadRequest("Category cannot be its own parent.");
        }
        // If passed as null explicitly (need a way to distinguish, but DTO is nullable int?) 
        // For now, if DTO has it, we set it. If we want to remove parent, UI sends null.
        if (dto.ParentId == null) 
        {
             category.ParentId = null;
        }

        category.UpdatedAt = DateTime.UtcNow;

        // Update image URL if provided
        if (!string.IsNullOrEmpty(dto.ImageUrl))
        {
            // Delete old image if it's different and exists
            if (!string.IsNullOrEmpty(category.ImageUrl) && category.ImageUrl != dto.ImageUrl)
            {
                DeleteImage(category.ImageUrl);
            }
            category.ImageUrl = dto.ImageUrl;
        }

        await _context.SaveChangesAsync();
        
        _cache.Remove("home_categories");
        await _cacheStore.EvictByTagAsync("categories", default);

        var result = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            ImageUrl = category.ImageUrl,
            IsActive = category.IsActive,
            DisplayOrder = category.DisplayOrder,
            ProductCount = await _context.Products.CountAsync(p => p.CategoryId == id),
            CreatedAt = category.CreatedAt
        };

        return Ok(result);
    }

    [HttpPost("{id}/delete")]
    public async Task<ActionResult> DeleteCategory(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound();

        // Delete image if exists
        if (!string.IsNullOrEmpty(category.ImageUrl))
        {
            DeleteImage(category.ImageUrl);
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        _cache.Remove("home_categories");
        await _cacheStore.EvictByTagAsync("categories", default);

        return NoContent();
    }

    [HttpPost("reorder")]
    public async Task<ActionResult<bool>> ReorderCategories([FromBody] ReorderCategoriesDto dto)
    {
        if (dto.OrderedIds == null || dto.OrderedIds.Count == 0)
            return BadRequest("OrderedIds is required");

        var categories = await _context.Categories
            .ToListAsync();

        for (int i = 0; i < dto.OrderedIds.Count; i++)
        {
            var category = categories.FirstOrDefault(c => c.Id == dto.OrderedIds[i]);
            if (category != null)
            {
                category.DisplayOrder = i + 1;
            }
        }

        await _context.SaveChangesAsync();
        
        _cache.Remove("home_categories");
        await _cacheStore.EvictByTagAsync("categories", default);

        return Ok(true);
    }

    private async Task<string> SaveImageAsync(IFormFile image)
    {
        // Create uploads directory if it doesn't exist
        var externalPath = _config["ExternalMediaPath"] ?? Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
        var uploadsFolder = Path.Combine(externalPath, "categories");
        Directory.CreateDirectory(uploadsFolder);

        // Generate unique filename
        var fileExtension = Path.GetExtension(image.FileName);
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await image.CopyToAsync(stream);
        }

        // Return relative URL
        return $"/uploads/categories/{fileName}";
    }

    private void DeleteImage(string imageUrl)
    {
        try
        {
            var fileName = Path.GetFileName(imageUrl);
            var externalPath = _config["ExternalMediaPath"] ?? Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
            var filePath = Path.Combine(externalPath, "categories", fileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }
        catch
        {
            // Log error but don't fail the request
        }
    }

    private static string GenerateSlug(string name)
    {
        return name.ToLower()
            .Replace(" ", "-")
            .Replace("?", "")
            .Replace("!", "")
            .Replace(".", "")
            .Replace(",", "")
            .Replace("'", "")
            .Replace("\"", "");
    }
}

using ECommerce.Core.Interfaces;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/subcategories")]
[Authorize(Roles = "Admin")]
public class AdminSubCategoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;
    private readonly ICacheService _cache;

    public AdminSubCategoryController(ApplicationDbContext context, IWebHostEnvironment environment, IConfiguration config, ICacheService cache)
    {
        _context = context;
        _environment = environment;
        _config = config;
        _cache = cache;
    }

    [HttpGet]
    public async Task<ActionResult<List<SubCategoryDto>>> GetAllSubCategories()
    {
        var subCategories = await _context.SubCategories
            .AsNoTracking()
            .OrderBy(sc => sc.CategoryId)
            .ThenBy(sc => sc.DisplayOrder)
            .Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                CategoryId = sc.CategoryId,
                IsActive = sc.IsActive,
                ImageUrl = sc.ImageUrl,
                Description = sc.Description,
                DisplayOrder = sc.DisplayOrder
            })
            .ToListAsync();

        return Ok(subCategories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SubCategoryDto>> GetSubCategoryById(int id)
    {
        var sc = await _context.SubCategories.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

        if (sc == null)
            return NotFound();

        var dto = new SubCategoryDto
        {
            Id = sc.Id,
            Name = sc.Name,
            Slug = sc.Slug,
            CategoryId = sc.CategoryId,
            IsActive = sc.IsActive,
            ImageUrl = sc.ImageUrl,
            Description = sc.Description,
            DisplayOrder = sc.DisplayOrder
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<SubCategoryDto>> CreateSubCategory([FromBody] SubCategoryCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("SubCategory name is required");

        // Validate Category exists
        if (!await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId))
             return BadRequest("Invalid CategoryId");

        var slug = string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Name) : dto.Slug;

        var subCategory = new SubCategory
        {
            Name = dto.Name,
            Slug = slug,
            CategoryId = dto.CategoryId,
            ImageUrl = dto.ImageUrl,
            Description = dto.Description,
            IsActive = dto.IsActive ?? true,
            DisplayOrder = dto.DisplayOrder ?? 0
        };

        _context.SubCategories.Add(subCategory);
        await _context.SaveChangesAsync();

        await InvalidateSubCategoryCacheAsync();

        var result = new SubCategoryDto
        {
            Id = subCategory.Id,
            Name = subCategory.Name,
            Slug = subCategory.Slug,
            CategoryId = subCategory.CategoryId,
            IsActive = subCategory.IsActive
        };

        return CreatedAtAction(nameof(GetSubCategoryById), new { id = subCategory.Id }, result);
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<SubCategoryDto>> UpdateSubCategory(int id, [FromBody] SubCategoryUpdateDto dto)
    {
        var subCategory = await _context.SubCategories.FindAsync(id);
        if (subCategory == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Name is required");

        if (dto.CategoryId != subCategory.CategoryId)
        {
             if (!await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId))
                 return BadRequest("Invalid CategoryId");
             subCategory.CategoryId = dto.CategoryId;
        }

        subCategory.Name = dto.Name;
        subCategory.Slug = string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Name) : dto.Slug;
        
        if (dto.IsActive.HasValue) subCategory.IsActive = dto.IsActive.Value;
        if (dto.DisplayOrder.HasValue) subCategory.DisplayOrder = dto.DisplayOrder.Value;
        
        if (dto.ImageUrl != null) subCategory.ImageUrl = dto.ImageUrl;
        if (dto.Description != null) subCategory.Description = dto.Description;

        await _context.SaveChangesAsync();

        await InvalidateSubCategoryCacheAsync();

        var result = new SubCategoryDto
        {
            Id = subCategory.Id,
            Name = subCategory.Name,
            Slug = subCategory.Slug,
            CategoryId = subCategory.CategoryId,
            IsActive = subCategory.IsActive
        };

        return Ok(result);
    }

    [HttpPost("{id}/delete")]
    public async Task<ActionResult> DeleteSubCategory(int id)
    {
        var subCategory = await _context.SubCategories.FindAsync(id);
        if (subCategory == null)
            return NotFound();

        _context.SubCategories.Remove(subCategory);
        await _context.SaveChangesAsync();

        await InvalidateSubCategoryCacheAsync();

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

            var externalPath = _config["ExternalMediaPath"] ?? Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
            var uploadsFolder = Path.Combine(externalPath, "subcategories");
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

            return Ok(new { url = $"/uploads/subcategories/{fileName}" });
        }
        catch (UnauthorizedAccessException ex)
        {
             return StatusCode(403, new { message = "Permission denied: The server process does not have write access to the subcategories folder. Error: " + ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during subcategory image upload: " + ex.Message });
        }
    }

    private async Task InvalidateSubCategoryCacheAsync()
    {
        await _cache.RemoveAsync("nav:mega-menu");
        await _cache.RemoveByPrefixAsync("product:list");
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

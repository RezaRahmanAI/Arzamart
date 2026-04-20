using ECommerce.Core.Interfaces;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Constants;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminCategoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public AdminCategoryController(ApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAllCategories()
    {
        // Category is Enum-based (Static)
        var categories = CategoryConstants.AllCategories;

        // SubCategory is Dynamic (Database)
        var dbSubCategories = await _context.SubCategories
            .AsNoTracking()
            .Include(sc => sc.Collections)
            .ToListAsync();

        foreach (var cat in categories)
        {
            cat.SubCategories = dbSubCategories
                .Where(sc => sc.CategoryId == cat.Id)
                .Select(sc => new SubCategoryDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    Slug = sc.Slug,
                    CategoryId = sc.CategoryId,
                    IsActive = sc.IsActive,
                    ImageUrl = sc.ImageUrl,

                    DisplayOrder = sc.DisplayOrder,
                    Collections = sc.Collections.Select(c => new CollectionDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug
                    }).ToList()
                }).ToList();
        }

        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetCategoryById(int id)
    {
        var category = CategoryConstants.AllCategories.FirstOrDefault(c => c.Id == id);
        if (category == null) return NotFound();

        // Optional: Attach subcategories
        var subCats = await _context.SubCategories
            .Where(sc => sc.CategoryId == id)
            .Include(sc => sc.Collections)
            .ToListAsync();
        
        category.SubCategories = subCats.Select(sc => new SubCategoryDto 
        { 
            Id = sc.Id, 
            Name = sc.Name,
            Collections = sc.Collections.Select(c => new CollectionDto { Id = c.Id, Name = c.Name }).ToList()
        }).ToList();

        return Ok(category);
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

            // Use same logic as subcategories for consistency
            var externalPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
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
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during category image upload: " + ex.Message });
        }
    }

    [HttpPost]
    public IActionResult CreateCategory() => BadRequest("Categories are fixed (Enum-based). Modification is disabled.");

    [HttpPost("{id}")]
    public IActionResult UpdateCategory() => BadRequest("Categories are fixed (Enum-based). Modification is disabled.");

    [HttpPost("{id}/delete")]
    public IActionResult DeleteCategory() => BadRequest("Categories are fixed (Enum-based). Modification is disabled.");

    [HttpPost("reorder")]
    public IActionResult ReorderCategories() => BadRequest("Category order is fixed.");
}

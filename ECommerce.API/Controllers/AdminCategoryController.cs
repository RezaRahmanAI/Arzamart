using ECommerce.API.Helpers;
using ECommerce.Core.Constants;
using ECommerce.Core.Interfaces;
using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("products")]
public class AdminCategoryController : ControllerBase
{
    private readonly ICategoryAdminService _categoryService;
    private readonly IFileUploadService _fileUploadService;

    public AdminCategoryController(
        ICategoryAdminService categoryService,
        IFileUploadService fileUploadService)
    {
        _categoryService = categoryService;
        _fileUploadService = fileUploadService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAllCategories()
    {
        return Ok(await _categoryService.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetCategoryById(int id)
    {
        var result = await _categoryService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CategoryCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Category name is required");

        try
        {
            var category = await _categoryService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, category);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategory(int id, CategoryUpdateDto dto)
    {
        try
        {
            await _categoryService.UpdateAsync(id, dto);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        try
        {
            await _categoryService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("reorder")]
    public async Task<IActionResult> ReorderCategories([FromBody] List<int> sortedIds)
    {
        try
        {
            await _categoryService.ReorderAsync(sortedIds);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("upload-image")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = FileUpload.MaxFileSize)]
    public async Task<ActionResult<UploadResultDto>> UploadImage(IFormFile file)
    {
        try
        {
            var url = await _fileUploadService.UploadAsync(file, "categories");
            return Ok(new UploadResultDto { Url = url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during category image upload." });
        }
    }
}

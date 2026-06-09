using ECommerce.Core.Constants;
using ECommerce.Core.Interfaces;
using ECommerce.Core.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.API.Helpers;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/subcategories")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("products")]
public class AdminSubCategoryController : ControllerBase
{
    private readonly ISubCategoryAdminService _subCategoryService;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;
    private readonly ICacheService _cache;
    private readonly IOutputCacheStore _cacheStore;

    public AdminSubCategoryController(ISubCategoryAdminService subCategoryService, IWebHostEnvironment environment, IConfiguration config, ICacheService cache, IOutputCacheStore cacheStore)
    {
        _subCategoryService = subCategoryService;
        _environment = environment;
        _config = config;
        _cache = cache;
        _cacheStore = cacheStore;
    }

    [HttpGet]
    public async Task<ActionResult<List<SubCategoryDto>>> GetAllSubCategories()
    {
        return Ok(await _subCategoryService.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SubCategoryDto>> GetSubCategoryById(int id)
    {
        var result = await _subCategoryService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SubCategoryDto>> CreateSubCategory([FromBody] SubCategoryCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("SubCategory name is required");

        try
        {
            var result = await _subCategoryService.CreateAsync(dto);
            await InvalidateSubCategoryCacheAsync();
            await _cacheStore.EvictByTagAsync("catalog", default);
            return CreatedAtAction(nameof(GetSubCategoryById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<SubCategoryDto>> UpdateSubCategory(int id, [FromBody] SubCategoryUpdateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Name is required");

        try
        {
            var result = await _subCategoryService.UpdateAsync(id, dto);
            await InvalidateSubCategoryCacheAsync();
            await _cacheStore.EvictByTagAsync("catalog", default);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> DeleteSubCategory(int id)
    {
        try
        {
            await _subCategoryService.DeleteAsync(id);
            await InvalidateSubCategoryCacheAsync();
            await _cacheStore.EvictByTagAsync("catalog", default);
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
    public async Task<ActionResult<UploadResultDto>> UploadImage([FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var uploadsFolder = PathHelper.GetUploadsFolder(_config, _environment, "subcategories");

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new UploadResultDto { Url = $"/uploads/subcategories/{fileName}" });
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
        await _cacheStore.EvictByTagAsync("categories", default);
    }
}

using ECommerce.API.Helpers;
using ECommerce.Core.Constants;
using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/subcategories")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("products")]
public class AdminSubCategoryController : ControllerBase
{
    private readonly ISubCategoryAdminService _subCategoryService;
    private readonly IFileUploadService _fileUploadService;

    public AdminSubCategoryController(ISubCategoryAdminService subCategoryService, IFileUploadService fileUploadService)
    {
        _subCategoryService = subCategoryService;
        _fileUploadService = fileUploadService;
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
            return CreatedAtAction(nameof(GetSubCategoryById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SubCategoryDto>> UpdateSubCategory(int id, [FromBody] SubCategoryUpdateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Name is required");

        try
        {
            var result = await _subCategoryService.UpdateAsync(id, dto);
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
            var url = await _fileUploadService.UploadAsync(file, "subcategories");
            return Ok(new UploadResultDto { Url = url });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = "Permission denied: " + ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during subcategory image upload." });
        }
    }
}

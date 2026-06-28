using ECommerce.API.Helpers;
using ECommerce.Core.Constants;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("products")]
public class AdminProductMediaController : ControllerBase
{
    private readonly IFileUploadService _fileUploadService;

    public AdminProductMediaController(IFileUploadService fileUploadService)
    {
        _fileUploadService = fileUploadService;
    }

    [HttpPost("upload-media")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = FileUpload.MaxFileSize)]
    public async Task<ActionResult<List<string>>> UploadProductMedia(List<IFormFile> files)
    {
        try
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded");

            var urls = await _fileUploadService.UploadMultipleAsync(files, "products");
            return Ok(urls);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = "Permission denied: " + ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during product media upload." });
        }
    }
}
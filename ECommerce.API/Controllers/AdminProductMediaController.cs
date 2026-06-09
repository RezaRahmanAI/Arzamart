using ECommerce.Core.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ECommerce.API.Helpers;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("products")]
public class AdminProductMediaController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;

    public AdminProductMediaController(IWebHostEnvironment environment, IConfiguration config)
    {
        _environment = environment;
        _config = config;
    }

    [HttpPost("upload-media")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = FileUpload.MaxFileSize)]
    public async Task<ActionResult<List<string>>> UploadProductMedia([FromForm] List<IFormFile> files)
    {
        try 
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded");

            var uploadedUrls = new List<string>();
            var uploadsFolder = PathHelper.GetUploadsFolder(_config, _environment, "products");

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    var fileExtension = Path.GetExtension(file.FileName);
                    var fileName = $"{Guid.NewGuid()}{fileExtension}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    uploadedUrls.Add($"/uploads/products/{fileName}");
                }
            }

            return Ok(uploadedUrls);
        }
        catch (UnauthorizedAccessException ex)
        {
             return StatusCode(403, new { message = "Permission denied: The server process does not have write access to the products folder. Error: " + ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during product media upload: " + ex.Message });
        }
    }
}
using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Products;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.API.Helpers;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("products")]
public class AdminProductsController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly IProductService _productService;
    private readonly IConfiguration _config;
    private readonly ICacheService _cache;
    private readonly IOutputCacheStore _cacheStore;

    public AdminProductsController(IWebHostEnvironment environment, IProductService productService, IConfiguration config, ICacheService cache, IOutputCacheStore cacheStore)
    {
        _environment = environment;
        _productService = productService;
        _config = config;
        _cache = cache;
        _cacheStore = cacheStore;
    }

    [HttpGet]
    public async Task<ActionResult<AdminProductListResultDto>> GetProducts(
        [FromQuery] string? searchTerm,
        [FromQuery] string? category,
        [FromQuery] string? statusTab,
        [FromQuery] string? stockStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _productService.GetAdminProductsAsync(searchTerm, category, statusTab, stockStatus, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProductById(int id)
    {
        var product = await _productService.GetProductByIdAsync(id, ignoreFilters: true);

        if (product == null) return NotFound();

        return Ok(product);
    }

    private static readonly System.Text.Json.JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
    };

    private ProductVariantsDto DeserializeVariantsDto(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new ProductVariantsDto();
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<ProductVariantsDto>(json, _jsonOptions) ?? new ProductVariantsDto();
        }
        catch
        {
            return new ProductVariantsDto();
        }
    }

    private ProductMetaDto DeserializeMetaDto(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new ProductMetaDto();
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<ProductMetaDto>(json, _jsonOptions) ?? new ProductMetaDto();
        }
        catch
        {
            return new ProductMetaDto();
        }
    }

    [HttpPost]
    public async Task<ActionResult> CreateProduct([FromBody] ProductCreateDto dto)
    {
        try
        {
            var result = await _productService.CreateProductAsync(dto);
            if (result == null) return BadRequest(new { message = "Error creating product" });

            await _cache.RemoveAsync("home_new_arrivals");
            await _cache.RemoveAsync("home_featured_products");
            await _cacheStore.EvictByTagAsync("catalog", default);

            return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException != null ? $". Inner: {ex.InnerException.Message}" : "";
            Console.WriteLine($"[ADMIN_ERROR] Error creating product: {ex.Message}{innerMsg}");
            return StatusCode(500, new { message = $"Error creating product: {ex.Message}{innerMsg}" });
        }
    }

    [HttpPost("{id}")]
    public async Task<ActionResult> UpdateProduct(int id, [FromBody] ProductUpdateDto dto)
    {
        try
        {
            Console.WriteLine($"[ADMIN_DEBUG] Updating Product {id}: {dto.Name}, Type: {dto.ProductType}");
            var result = await _productService.UpdateProductAsync(id, dto, ignoreFilters: true);
            if (result == null) return BadRequest(new { message = "Error updating product" });

            await _cache.RemoveAsync("home_new_arrivals");
            await _cache.RemoveAsync("home_featured_products");
            await _cacheStore.EvictByTagAsync("catalog", default);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException != null ? $". Inner: {ex.InnerException.Message}" : "";
            Console.WriteLine($"[ADMIN_ERROR] Error updating product: {ex.Message}{innerMsg}");
            return StatusCode(500, new { message = $"Error updating product: {ex.Message}{innerMsg}" });
        }
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<bool>> DeleteProduct(int id)
    {
        var (success, mainImageUrl, imageUrls) = await _productService.DeleteProductAsync(id);

        if (!success)
            return NotFound();

        if (!string.IsNullOrEmpty(mainImageUrl))
            DeleteImageFile(mainImageUrl);

        foreach (var url in imageUrls)
            DeleteImageFile(url);

        await _cache.RemoveAsync("home_new_arrivals");
        await _cache.RemoveAsync("home_featured_products");
        await _cacheStore.EvictByTagAsync("catalog", default);

        return Ok(true);
    }


    private List<object> DeserializeVariants(string? json)
    {
        if (string.IsNullOrEmpty(json))
            return new List<object>();
        
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<object>>(json) ?? new List<object>();
        }
        catch
        {
            return new List<object>();
        }
    }

    private void DeleteImageFile(string imageUrl)
    {
        try
        {
            var fileName = Path.GetFileName(imageUrl);
            var uploadsFolder = PathHelper.GetUploadsFolder(_config, _environment, "products");
            var filePath = Path.Combine(uploadsFolder, fileName);
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
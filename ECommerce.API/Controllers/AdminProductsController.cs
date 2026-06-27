using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Products;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("products")]
public class AdminProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IProductAdminHelper _productAdminHelper;
    private readonly ILogger<AdminProductsController> _logger;

    public AdminProductsController(IProductService productService, IProductAdminHelper productAdminHelper, ILogger<AdminProductsController> logger)
    {
        _productService = productService;
        _productAdminHelper = productAdminHelper;
        _logger = logger;
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

    [HttpPost]
    public async Task<ActionResult> CreateProduct([FromBody] ProductCreateDto dto)
    {
        try
        {
            var result = await _productService.CreateProductAsync(dto);
            if (result == null) return BadRequest(new { message = "Error creating product" });

            return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException != null ? $". Inner: {ex.InnerException.Message}" : "";
            _logger.LogError(ex, "Error creating product: {Message}{InnerMsg}", ex.Message, innerMsg);
            return StatusCode(500, new { message = "An error occurred while creating the product." });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateProduct(int id, [FromBody] ProductUpdateDto dto)
    {
        try
        {
            _logger.LogInformation("Updating Product {ProductId}: {Name}, Type: {Type}", id, dto.Name, dto.ProductType);
            var result = await _productService.UpdateProductAsync(id, dto, ignoreFilters: true);
            if (result == null) return BadRequest(new { message = "Error updating product" });

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException != null ? $". Inner: {ex.InnerException.Message}" : "";
            _logger.LogError(ex, "Error updating product: {Message}{InnerMsg}", ex.Message, innerMsg);
            return StatusCode(500, new { message = "An error occurred while updating the product." });
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
            _productAdminHelper.DeleteImageFile(mainImageUrl);

        foreach (var url in imageUrls)
            _productAdminHelper.DeleteImageFile(url);

        return Ok(true);
    }
}

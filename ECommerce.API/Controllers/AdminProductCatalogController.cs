using ECommerce.Core.DTOs.Products;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("products")]
public class AdminProductCatalogController : ControllerBase
{
    private readonly IProductService _productService;

    public AdminProductCatalogController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<ProductSearchResultDto>>> SearchProductsForCombo([FromQuery] string? q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(Array.Empty<object>());

        var products = await _productService.SearchProductsForComboAsync(q);
        return Ok(products);
    }

    [HttpGet("available-sizes")]
    public async Task<ActionResult<List<string>>> GetAvailableSizes()
    {
        var sizes = await _productService.GetAvailableSizesAsync();
        return Ok(sizes);
    }

    [HttpGet("catalog")]
    public async Task<ActionResult<List<ProductCatalogItemDto>>> GetProductCatalog()
    {
        var products = await _productService.GetProductCatalogAsync();
        return Ok(products);
    }
}

using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("products")]
public class AdminProductInventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public AdminProductInventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet("inventory")]
    public async Task<ActionResult<List<ProductInventoryDto>>> GetInventory()
    {
        var inventory = await _inventoryService.GetInventoryAsync();
        return Ok(inventory);
    }

    [HttpPost("inventory/{variantId}")]
    public async Task<ActionResult> UpdateStock(int variantId, UpdateInventoryDto dto)
    {
        try
        {
            await _inventoryService.UpdateStockAsync(variantId, dto);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }

        return Ok(new { message = "Stock updated successfully" });
    }

    [HttpPost("inventory/product/{productId}")]
    public async Task<ActionResult> UpdateProductStock(int productId, UpdateInventoryDto dto)
    {
        try
        {
            await _inventoryService.UpdateProductStockAsync(productId, dto);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }

        return Ok(new { message = "Stock updated successfully" });
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("inventory/sync-all")]
    public async Task<ActionResult> SyncAllInventory()
    {
        var fixedCount = await _inventoryService.SyncAllInventoryAsync();

        if (fixedCount > 0)
        {
            return Ok(new { message = $"Synchronized {fixedCount} products successfully." });
        }

        return Ok(new { message = "All products are already synchronized." });
    }
}

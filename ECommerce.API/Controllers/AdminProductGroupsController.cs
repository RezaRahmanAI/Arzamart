using ECommerce.Core.DTOs.Admin;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/product-groups")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("products")]
public class AdminProductGroupsController : ControllerBase
{
    private readonly IProductGroupService _productGroupService;

    public AdminProductGroupsController(IProductGroupService productGroupService)
    {
        _productGroupService = productGroupService;
    }

    private ProductGroupDto MapToDto(ECommerce.Core.Entities.ProductGroup group) => new()
    {
        Id = group.Id,
        Name = group.Name ?? string.Empty,
        Description = group.Description,
        CreatedAt = group.CreatedAt,
        ProductIds = group.Products?.Select(p => p.Id).ToList() ?? new List<int>()
    };

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductGroupDto>>> GetGroups()
    {
        var groups = await _productGroupService.GetAllAsync();
        return Ok(groups.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductGroupDto>> GetGroup(int id)
    {
        var group = await _productGroupService.GetByIdAsync(id);
        if (group == null) return NotFound();
        return Ok(MapToDto(group));
    }

    [HttpPost]
    public async Task<ActionResult<ProductGroupDto>> CreateGroup([FromBody] CreateProductGroupDto dto)
    {
        var entity = new ECommerce.Core.Entities.ProductGroup
        {
            Name = dto.Name,
            Description = dto.Description
        };
        var created = await _productGroupService.CreateAsync(entity);
        return CreatedAtAction(nameof(GetGroup), new { id = created.Id }, MapToDto(created));
    }

    [HttpPost("{id}")]
    public async Task<ActionResult> UpdateGroup(int id, [FromBody] CreateProductGroupDto dto)
    {
        var entity = new ECommerce.Core.Entities.ProductGroup
        {
            Name = dto.Name,
            Description = dto.Description
        };
        await _productGroupService.UpdateAsync(id, entity);
        return NoContent();
    }

    [HttpPost("{id}/delete")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> DeleteGroup(int id)
    {
        try
        {
            await _productGroupService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Product group with ID {id} not found." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{groupId}/products/{productId}")]
    public async Task<ActionResult> AddProductToGroup(int groupId, int productId)
    {
        try
        {
            await _productGroupService.AddProductToGroupAsync(groupId, productId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Product group or product not found." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{groupId}/products/{productId}/delete")]
    public async Task<ActionResult> RemoveProductFromGroup(int groupId, int productId)
    {
        try
        {
            await _productGroupService.RemoveProductFromGroupAsync(groupId, productId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Product group or product not found." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

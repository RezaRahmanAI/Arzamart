using System.Collections.Generic;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/adultproducts")]
public class AdultProductController : ControllerBase
{
    private readonly IAdultProductService _service;

    public AdultProductController(IAdultProductService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdultProductDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<AdultProductDto>>> GetActive()
    {
        var products = await _service.GetAllAsync();
        return Ok(products.Where(p => p.IsActive));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AdultProductDto>> GetById(int id)
    {
        var product = await _service.GetByIdAsync(id);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<AdultProductDto>> GetBySlug(string slug)
    {
        var product = await _service.GetBySlugAsync(slug);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<AdultProductDto>> Create(AdultProductCreateUpdateDto dto)
    {
        var product = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, AdultProductCreateUpdateDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        if (!result) return NotFound();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}

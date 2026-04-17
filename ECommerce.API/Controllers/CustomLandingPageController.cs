using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/custom-landing-page")]
public class CustomLandingPageController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CustomLandingPageController(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<CustomLandingPageDataDto>> GetData(string slug)
    {
        var product = await _context.Products
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Slug == slug);

        if (product == null)
            return NotFound();

        var config = await _context.CustomLandingPageConfigs
            .FirstOrDefaultAsync(c => c.ProductId == product.Id);

        return Ok(new CustomLandingPageDataDto
        {
            Product = _mapper.Map<ProductDto>(product),
            Config = config != null ? _mapper.Map<CustomLandingPageConfigDto>(config) : null
        });
    }
}

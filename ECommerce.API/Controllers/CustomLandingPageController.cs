using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
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
        // 1. Resolve Product (Allow ID or Slug, bypass global filters for designer support)
        Product? product = null;
        
        // Try ID first if numeric
        if (int.TryParse(slug, out var id))
        {
            product = await _context.Products
                .IgnoreQueryFilters()
                .Include(p => p.Images)
                .Include(p => p.Variants)
                .Include(p => p.Category)
                .Include(p => p.ProductGroup)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        // Try Slug
        if (product == null)
        {
            product = await _context.Products
                .IgnoreQueryFilters()
                .Include(p => p.Images)
                .Include(p => p.Variants)
                .Include(p => p.Category)
                .Include(p => p.ProductGroup)
                .FirstOrDefaultAsync(p => p.Slug == slug);
        }

        if (product == null)
            return NotFound(new { message = "Resource not found: Product does not exist or is inactive." });

        // 2. Resolve Config
        var config = await _context.CustomLandingPageConfigs
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.ProductId == product.Id);

        // 3. Resolve Related Products (Dynamic fallback for suggestions)
        // We fetch products from the same category or group as a baseline
        var relatedItems = await _context.Products
            .AsNoTracking()
            .IgnoreQueryFilters() // Also allow inactive for related suggestions in designer
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Category)
            .Include(p => p.ProductGroup)
            .Where(p => p.Id != product.Id && (p.CategoryId == product.CategoryId || (product.ProductGroupId != null && p.ProductGroupId == product.ProductGroupId)))
            .OrderBy(p => p.IsFeatured ? 0 : 1)
            .ThenByDescending(p => p.CreatedAt)
            .Take(12)
            .ToListAsync();

        return Ok(new CustomLandingPageDataDto
        {
            Product = _mapper.Map<ProductDto>(product),
            Config = config != null ? _mapper.Map<CustomLandingPageConfigDto>(config) : null,
            RelatedProducts = _mapper.Map<IReadOnlyList<ProductListDto>>(relatedItems)
        });
    }
}

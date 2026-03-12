using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IGenericRepository<Category> _categoryRepo;
    private readonly IMapper _mapper;
    private readonly IMemoryCache _cache;

    public CategoriesController(IGenericRepository<Category> categoryRepo, IMapper mapper, IMemoryCache cache)
    {
        _categoryRepo = categoryRepo;
        _mapper = mapper;
        _cache = cache;
    }

    [HttpGet]
    [ResponseCache(Duration = 600)]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetCategories()
    {
        const string cacheKey = "categories_all";

        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<CategoryDto>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var spec = new CategoriesWithSubCategoriesSpec();
        var categories = await _categoryRepo.ListAsync(spec);
        var result = _mapper.Map<IReadOnlyList<CategoryDto>>(categories);
        
        _cache.Set(cacheKey, result, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
        return Ok(result);
    }
}

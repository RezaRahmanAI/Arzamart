using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class CustomLandingPageService : ICustomLandingPageService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CustomLandingPageService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<CustomLandingPageDataDto?> GetDataAsync(string slug)
    {
        var query = _unitOfWork.Repository<Product>().GetQueryable()
            .IgnoreQueryFilters()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Category)
            .Include(p => p.ProductGroup);

        Product? product;
        if (int.TryParse(slug, out var id))
            product = await query.FirstOrDefaultAsync(p => p.Id == id);
        else
            product = await query.FirstOrDefaultAsync(p => p.Slug == slug);

        if (product == null) return null;

        var config = await _unitOfWork.Repository<CustomLandingPageConfig>().GetQueryable()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.ProductId == product.Id);

        var relatedQuery = _unitOfWork.Repository<Product>().GetQueryable()
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Where(p => p.Id != product.Id && (p.CategoryId == product.CategoryId || (product.ProductGroupId != null && p.ProductGroupId == product.ProductGroupId)));

        var relatedProducts = await relatedQuery
            .OrderBy(p => p.IsFeatured ? 0 : 1)
            .ThenByDescending(p => p.CreatedAt)
            .Take(12)
            .ToListAsync();

        return new CustomLandingPageDataDto
        {
            Product = _mapper.Map<ProductDto>(product),
            Config = config != null ? _mapper.Map<CustomLandingPageConfigDto>(config) : null,
            RelatedProducts = _mapper.Map<IReadOnlyList<ProductListDto>>(relatedProducts)
        };
    }
}

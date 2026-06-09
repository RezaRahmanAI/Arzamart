using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using ECommerce.Infrastructure.Cache;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public interface IProductQueryService
{
    Task<PaginationDto<ProductListDto>> GetProductsAsync(
        string? sort,
        int? categoryId,
        int? subCategoryId,
        int? collectionId,
        string? categorySlug,
        string? subCategorySlug,
        string? collectionSlug,
        string? searchTerm,
        string? tier,
        string? tags,
        bool? isNew,
        bool? isFeatured,
        int pageIndex,
        int pageSize,
        int? productGroupId,
        int? productType);

    Task<IReadOnlyList<ProductListDto>> GetProductsByIdsAsync(List<int> ids);

    Task<ProductDto?> GetProductBySlugAsync(string slug);
    Task<ProductDto?> GetProductByIdAsync(int id, bool ignoreFilters = false);
    Task<List<string>> GetAvailableSizesAsync();
}

public class ProductQueryService : IProductQueryService
{
    private readonly IMapper _mapper;
    private readonly AppCache _cache;

    public ProductQueryService(IMapper mapper, AppCache cache)
    {
        _mapper = mapper;
        _cache = cache;
    }

    public Task<PaginationDto<ProductListDto>> GetProductsAsync(
        string? sort,
        int? categoryId,
        int? subCategoryId,
        int? collectionId,
        string? categorySlug,
        string? subCategorySlug,
        string? collectionSlug,
        string? searchTerm,
        string? tier,
        string? tags,
        bool? isNew,
        bool? isFeatured,
        int pageIndex,
        int pageSize,
        int? productGroupId,
        int? productType)
    {
        var source = _cache.Products.Values
            .Where(p => p.IsActive);

        if (categoryId.HasValue)
            source = source.Where(p => p.CategoryId == categoryId.Value);

        if (subCategoryId.HasValue)
            source = source.Where(p => p.SubCategoryId == subCategoryId.Value);

        if (collectionId.HasValue)
            source = source.Where(p => p.CollectionId == collectionId.Value);

        if (!string.IsNullOrEmpty(categorySlug))
            source = source.Where(p => p.Category != null && p.Category.Slug == categorySlug);

        if (!string.IsNullOrEmpty(subCategorySlug))
            source = source.Where(p => p.SubCategory != null && p.SubCategory.Slug == subCategorySlug);

        if (!string.IsNullOrEmpty(collectionSlug))
            source = source.Where(p => p.Collection != null && p.Collection.Slug == collectionSlug);

        if (!string.IsNullOrEmpty(searchTerm))
        {
            var term = searchTerm.ToLower();
            source = source.Where(p => p.Name.ToLower().Contains(term)
                || (p.Description != null && p.Description.ToLower().Contains(term)));
        }

        if (!string.IsNullOrEmpty(tier))
            source = source.Where(p => p.Tier == tier);

        if (!string.IsNullOrEmpty(tags))
        {
            var tagList = tags.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim().ToLower()).ToList();
            source = source.Where(p => p.Tags != null && tagList.Any(tag => p.Tags.ToLower().Contains(tag)));
        }

        if (isNew.HasValue)
            source = source.Where(p => p.IsNew == isNew.Value);

        if (isFeatured.HasValue)
            source = source.Where(p => p.IsFeatured == isFeatured.Value);

        if (productGroupId.HasValue)
            source = source.Where(p => p.ProductGroupId == productGroupId.Value);

        if (productType.HasValue)
            source = source.Where(p => (int)p.ProductType == productType.Value);

        source = sort?.ToLower() switch
        {
            "price_asc" => source.OrderBy(p => p.Variants.Any() ? p.Variants.Min(v => v.Price) ?? 0 : 0),
            "price_desc" => source.OrderByDescending(p => p.Variants.Any() ? p.Variants.Max(v => v.Price) ?? 0 : 0),
            "name" => source.OrderBy(p => p.Name),
            "newest" => source.OrderByDescending(p => p.CreatedAt),
            "popular" => source.OrderByDescending(p => p.Reviews.Count),
            _ => source.OrderByDescending(p => p.SortOrder).ThenByDescending(p => p.CreatedAt)
        };

        var total = source.Count();
        var items = source
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var dtos = _mapper.Map<IReadOnlyList<ProductListDto>>(items);

        return Task.FromResult(new PaginationDto<ProductListDto>(pageIndex, pageSize, total, dtos));
    }

    public Task<IReadOnlyList<ProductListDto>> GetProductsByIdsAsync(List<int> ids)
    {
        var products = ids
            .Select(id => _cache.Products.TryGetValue(id, out var p) ? p : null)
            .Where(p => p != null)
            .ToList();

        var dtos = _mapper.Map<IReadOnlyList<ProductListDto>>(products);
        return Task.FromResult(dtos);
    }

    public Task<ProductDto?> GetProductBySlugAsync(string slug)
    {
        var product = _cache.Products.Values.FirstOrDefault(p => p.Slug == slug);
        return Task.FromResult(product == null ? null : _mapper.Map<ProductDto>(product));
    }

    public Task<ProductDto?> GetProductByIdAsync(int id, bool ignoreFilters = false)
    {
        _cache.Products.TryGetValue(id, out var product);
        return Task.FromResult(product == null ? null : _mapper.Map<ProductDto>(product));
    }

    public Task<List<string>> GetAvailableSizesAsync()
    {
        var sizes = _cache.Products.Values
            .SelectMany(p => p.Variants)
            .Where(v => !string.IsNullOrEmpty(v.Size))
            .Select(v => v.Size!)
            .Distinct()
            .ToList();

        var sizeOrder = new List<string>
        {
            "2", "4", "6", "8", "10", "12", "14", "16",
            "28", "30", "32", "34", "36", "38", "40", "42", "44",
            "xs", "s", "m", "l", "xl", "xxl", "2xl", "xxxl", "3xl", "4xl", "5xl"
        };

        var ordered = sizes.OrderBy(s =>
        {
            var index = sizeOrder.IndexOf(s.ToLower());
            return index == -1 ? 999 : index;
        }).ThenBy(s => s).ToList();

        return Task.FromResult(ordered);
    }
}

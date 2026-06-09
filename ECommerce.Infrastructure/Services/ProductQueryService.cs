using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Specifications;
using ECommerce.Infrastructure.Data;
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
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ICacheService _cache;

    public ProductQueryService(IUnitOfWork unitOfWork, IMapper mapper, ICacheService cache)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<PaginationDto<ProductListDto>> GetProductsAsync(
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
        var cacheKey = $"products_{sort}_{categoryId}_{subCategoryId}_{collectionId}_{categorySlug}_{subCategorySlug}_{collectionSlug}_{searchTerm}_{tier}_{tags}_{isNew}_{isFeatured}_{pageIndex}_{pageSize}_{productGroupId}_{productType}";

        return (await _cache.GetOrCreateAsync(cacheKey, async () =>
        {
            var skip = (pageIndex - 1) * pageSize;
            var take = pageSize;

            var spec = new ProductsWithCategoriesSpecification(sort, categoryId, subCategoryId, collectionId, categorySlug, subCategorySlug, collectionSlug, searchTerm, tier, tags, isNew, isFeatured, skip, take, productGroupId, productType);
            var countSpec = new ProductsWithCategoriesSpecification(sort, categoryId, subCategoryId, collectionId, categorySlug, subCategorySlug, collectionSlug, searchTerm, tier, tags, isNew, isFeatured, null, null, productGroupId, productType);

            var totalItems = await _unitOfWork.Repository<Product>().CountAsync(countSpec);
            var products = await _unitOfWork.Repository<Product>().ListAsync(spec);
            var dtos = _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductListDto>>(products ?? new List<Product>());

            return new PaginationDto<ProductListDto>(pageIndex, pageSize, totalItems, dtos);
        }, TimeSpan.FromMinutes(5)))!;
    }

    public async Task<ProductDto?> GetProductBySlugAsync(string slug)
    {
        var cacheKey = $"product:details:slug:{slug}";

        return (await _cache.GetOrCreateAsync(cacheKey, async () =>
        {
            var spec = new ProductsWithCategoriesSpecification(slug);
            var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec);

            return product == null ? null : _mapper.Map<Product, ProductDto>(product);
        }, TimeSpan.FromMinutes(60)))!;
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id, bool ignoreFilters = false)
    {
        var cacheKey = $"product:details:id:{id}{(ignoreFilters ? "_ignoreFilters" : "")}";

        return (await _cache.GetOrCreateAsync(cacheKey, async () =>
        {
            var spec = new ProductsWithCategoriesSpecification(id);
            var product = ignoreFilters
                ? await _unitOfWork.Repository<Product>().GetEntityWithSpecIgnoreFiltersAsync(spec)
                : await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec);

            return product == null ? null : _mapper.Map<Product, ProductDto>(product);
        }, TimeSpan.FromMinutes(60)))!;
    }

    public async Task<List<string>> GetAvailableSizesAsync()
    {
        return (await _cache.GetOrCreateAsync("product:sizes", async () =>
        {
            var sizes = await _unitOfWork.Repository<ProductVariant>()
                .GetQueryable()
                .Where(v => !string.IsNullOrEmpty(v.Size))
                .Select(v => v.Size!)
                .Distinct()
                .ToListAsync();

            var sizeOrder = new List<string>
            {
                "2", "4", "6", "8", "10", "12", "14", "16",
                "28", "30", "32", "34", "36", "38", "40", "42", "44",
                "xs", "s", "m", "l", "xl", "xxl", "2xl", "xxxl", "3xl", "4xl", "5xl"
            };

            return sizes.OrderBy(s =>
            {
                var index = sizeOrder.IndexOf(s.ToLower());
                return index == -1 ? 999 : index;
            }).ThenBy(s => s).ToList();
        }, TimeSpan.FromHours(24)))!;
    }

    public async Task<IReadOnlyList<ProductListDto>> GetProductsByIdsAsync(List<int> ids)
    {
        var spec = new ProductsWithCategoriesSpecification(ids);
        var products = await _unitOfWork.Repository<Product>().ListAsync(spec);
        return _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductListDto>>(products);
    }
}

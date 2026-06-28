using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Specifications;
using ECommerce.Core.Enums;
using ECommerce.Core.DTOs.Products;
using ECommerce.Core.Constants;
using ECommerce.Infrastructure.Cache;
using ECommerce.Infrastructure.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly AppCache _cache;
    private readonly ILogger<ProductService> _logger;

    public ProductService(IUnitOfWork unitOfWork, IMapper mapper, AppCache cache, ILogger<ProductService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _cache = cache;
        _logger = logger;
    }

    public Task<ProductDto?> GetProductByIdAsync(int id, bool ignoreFilters = false)
    {
        _cache.Products.TryGetValue(id, out var product);
        return Task.FromResult(product == null ? null : _mapper.Map<ProductDto>(product));
    }

    public async Task<AdminProductListResultDto> GetAdminProductsAsync(string? searchTerm, string? category, string? subCategory, string? statusTab, string? stockStatus, int page, int pageSize)
    {
        var query = _unitOfWork.Repository<Product>().GetQueryable()
            .IgnoreQueryFilters()
            .AsNoTracking();

        if (!string.IsNullOrEmpty(searchTerm))
            query = query.Where(p => p.Name.Contains(searchTerm) || (p.Sku ?? "").Contains(searchTerm));

        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            var dbCat = await _unitOfWork.Repository<Category>().GetQueryable()
                .FirstOrDefaultAsync(c => c.Name.ToLower() == category.ToLower());
            if (dbCat != null)
                query = query.Where(p => p.CategoryId == dbCat.Id);
        }

        if (!string.IsNullOrEmpty(subCategory) && subCategory != "all")
        {
            var dbSubCat = await _unitOfWork.Repository<SubCategory>().GetQueryable()
                .FirstOrDefaultAsync(s => s.Name.ToLower() == subCategory.ToLower());
            if (dbSubCat != null)
                query = query.Where(p => p.SubCategoryId == dbSubCat.Id);
        }

        if (!string.IsNullOrEmpty(statusTab) && statusTab != "all")
        {
            bool isActive = statusTab.ToLower() == "active";
            query = query.Where(p => p.IsActive == isActive);
        }

        if (!string.IsNullOrEmpty(stockStatus) && stockStatus != "all")
        {
            if (stockStatus.ToLower() == "instock")
                query = query.Where(p => p.StockQuantity > 0);
            else if (stockStatus.ToLower() == "outofstock")
                query = query.Where(p => p.StockQuantity <= 0);
        }

        var total = await query.CountAsync();
        var rawProducts = await query
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .AsSplitQuery()
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var products = rawProducts.Select(p => new AdminProductListItemDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            ShortDescription = p.ShortDescription,
            Sku = p.Sku,
            Price = p.Variants.FirstOrDefault()?.Price ?? 0,
            SalePrice = p.Variants.FirstOrDefault()?.CompareAtPrice,
            PurchaseRate = p.Variants.FirstOrDefault()?.PurchaseRate,
            StockQuantity = p.Variants.Any() ? p.Variants.Sum(v => v.StockQuantity) : p.StockQuantity,
            IsNew = p.IsNew,
            IsFeatured = p.IsFeatured,
            Status = p.IsActive ? "Active" : "Draft",
            ImageUrl = p.ImageUrl,
            Category = p.Category?.Name ?? "",
            SubCategory = p.SubCategory?.Name ?? "",
            CategoryId = p.CategoryId,
            SubCategoryId = p.SubCategoryId,
            MediaUrls = p.Images.Select(i => i.Url).ToList(),
            Images = p.Images.Select(i => new ProductImageDto { ImageUrl = i.Url }).ToList(),
            Variants = p.Variants.Select(v => new ProductVariantDto { Id = v.Id, Size = v.Size, StockQuantity = v.StockQuantity, Price = v.Price }).ToList(),
            Tier = p.Tier,
            Tags = p.Tags,
            SortOrder = p.SortOrder,
            CreatedAt = p.CreatedAt,
            Slug = p.Slug
        }).ToList();

        return new AdminProductListResultDto { Items = products, Total = total };
    }

    public async Task<(bool Success, string? MainImageUrl, List<string> ImageUrls)> DeleteProductAsync(int id)
    {
        var product = await _unitOfWork.Repository<Product>().GetQueryable()
            .IgnoreQueryFilters()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return (false, null, new List<string>());

        var mainImageUrl = product.ImageUrl;
        var imageUrls = product.Images.Select(i => i.Url).ToList();

        var clpConfig = await _unitOfWork.Repository<CustomLandingPageConfig>().GetQueryable()
            .FirstOrDefaultAsync(c => c.ProductId == id);
        if (clpConfig != null)
            _unitOfWork.Repository<CustomLandingPageConfig>().Delete(clpConfig);

        try
        {
            _unitOfWork.Repository<Product>().Delete(product);
            await _unitOfWork.Complete();
            _cache.Products.TryRemove(id, out var removedProduct);
            if (removedProduct != null && !string.IsNullOrEmpty(removedProduct.Slug))
                _cache.ProductSlugIndex.TryRemove(removedProduct.Slug, out _);
            RebuildHomePageCache();
            return (true, mainImageUrl, imageUrls);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return (false, null, new List<string>());
        }
    }

    public async Task<ProductDto?> CreateProductAsync(ProductCreateDto dto)
    {
        int.TryParse(dto.Category, out int catId);
        var category = await _unitOfWork.Repository<Category>().GetQueryable()
            .FirstOrDefaultAsync(c => c.Name.ToLower() == dto.Category.ToLower() || (catId != 0 && c.Id == catId));
        
        if (category == null) throw new KeyNotFoundException($"Category {dto.Category} not found");

        var slug = await GenerateUniqueSlugAsync(dto.Name);
        var subCategoryId = await ValidateSubCategoryId(dto.SubCategoryId, category.Id);
        var collectionId = await ValidateCollectionId(dto.CollectionId, dto.SubCategoryId);

        var product = ProductFactory.MapToEntity(dto, category.Id, subCategoryId, collectionId, slug);

        _unitOfWork.Repository<Product>().Add(product);
        var result = await _unitOfWork.Complete();
        if (result <= 0) return null!;

        var full = await LoadProductFullAsync(product.Id);
        UpdateCache(full);
        RebuildHomePageCache();

        return _mapper.Map<ProductDto>(full);
    }

    public async Task<ProductDto?> UpdateProductAsync(int id, ProductUpdateDto dto, bool ignoreFilters = false)
    {
        var spec = new ProductsWithCategoriesSpecification(id);
        var product = ignoreFilters
            ? await _unitOfWork.Repository<Product>().GetEntityWithSpecIgnoreFiltersAsync(spec, track: true)
            : await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec, track: true);

        if (product == null) throw new KeyNotFoundException("Product not found");

        int.TryParse(dto.Category, out int catId);
        var category = await _unitOfWork.Repository<Category>().GetQueryable()
            .FirstOrDefaultAsync(c => c.Name.ToLower() == dto.Category.ToLower() || (catId != 0 && c.Id == catId));
        
        if (category == null) throw new KeyNotFoundException($"Category {dto.Category} not found");

        var subCategoryId = await ValidateSubCategoryId(dto.SubCategoryId, category.Id);
        var collectionId = await ValidateCollectionId(dto.CollectionId, dto.SubCategoryId);

        ProductFactory.ApplyUpdate(product, dto, category.Id, subCategoryId, collectionId);
        ProductFactory.SyncImages(product, dto.Media);
        ProductFactory.SyncVariants(product, dto.InventoryVariants);
        ProductFactory.SyncComboItems(product, dto.ComboItems, dto.ProductType);

        _unitOfWork.Repository<Product>().Update(product);
        await _unitOfWork.Complete();

        var full = await LoadProductFullAsync(product.Id);
        UpdateCache(full);
        RebuildHomePageCache();

        return _mapper.Map<ProductDto>(full);
    }

    private void RebuildHomePageCache()
    {
        lock (_cache.RebuildLock)
        {
            HomePageCacheRebuilder.Rebuild(_cache);
        }
    }

    private async Task<Product> LoadProductFullAsync(int productId)
    {
        return await _unitOfWork.Repository<Product>().GetQueryable()
            .AsNoTracking()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .Include(p => p.ComboItems).ThenInclude(ci => ci.Product)
            .Include(p => p.ComboItems).ThenInclude(ci => ci.ProductVariant)
            .AsSplitQuery()
            .FirstAsync(p => p.Id == productId);
    }

    private void UpdateCache(Product product)
    {
        _cache.Products[product.Id] = product;
        if (!string.IsNullOrEmpty(product.Slug))
            _cache.ProductSlugIndex[product.Slug] = product.Id;
    }


    public async Task<List<ProductSearchResultDto>> SearchProductsForComboAsync(string? q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return new List<ProductSearchResultDto>();

        var searchTerm = q.Trim().ToLower();

        var products = _cache.Products.Values
            .Where(p => p.Name.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)
                     || (p.Sku != null && p.Sku.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)))
            .OrderByDescending(p => p.CreatedAt)
            .Take(15)
            .ToList();

        return products.Select(p => new ProductSearchResultDto
        {
            Id = p.Id,
            Name = p.Name,
            ImageUrl = p.ImageUrl,
            Sku = p.Sku,
            Price = p.Variants.Any(v => v.Price > 0)
                ? p.Variants.Where(v => v.Price > 0).Min(v => v.Price) ?? 0
                : 0,
            Variants = p.Variants.Select(v => new ProductSearchVariantDto
            {
                Id = v.Id,
                Size = v.Size,
                StockQuantity = v.StockQuantity,
                Price = v.Price ?? 0
            }).ToList()
        }).ToList();
    }

    public Task<List<ProductCatalogItemDto>> GetProductCatalogAsync()
    {
        var products = _cache.Products.Values
            .OrderByDescending(p => p.CreatedAt)
            .ToList();

        var dtos = products.Select(p => new ProductCatalogItemDto
        {
            Id = p.Id,
            Name = p.Name,
            Sku = p.Sku,
            ImageUrl = p.ImageUrl,
            Price = p.Variants.Any() ? p.Variants.Min(v => v.Price) ?? 0 : 0,
            IsActive = p.IsActive,
            Status = p.IsActive ? "Active" : "Draft",
            StockQuantity = p.Variants.Any() ? p.Variants.Sum(v => v.StockQuantity) : p.StockQuantity,
            Slug = p.Slug
        }).ToList();

        return Task.FromResult(dtos);
    }

    public Task<List<string>> GetAvailableSizesAsync()
    {
        var sizes = _cache.Products.Values
            .SelectMany(p => p.Variants)
            .Where(v => !string.IsNullOrEmpty(v.Size))
            .Select(v => v.Size!)
            .Distinct()
            .ToList();

        var sizeOrder = new List<string> { 
            "2", "4", "6", "8", "10", "12", "14", "16",
            "28", "30", "32", "34", "36", "38", "40", "42", "44",
            "xs", "s", "m", "l", "xl", "xxl", "2xl", "xxxl", "3xl", "4xl", "5xl" 
        };

        var ordered = sizes.OrderBy(s => {
            var index = sizeOrder.IndexOf(s.ToLower());
            return index == -1 ? 999 : index;
        }).ThenBy(s => s).ToList();

        return Task.FromResult(ordered);
    }

    private async Task<int?> ValidateSubCategoryId(int? subCatId, int catId)
    {
        if (subCatId == null || subCatId <= 0) return null;
        var exists = await _unitOfWork.Repository<SubCategory>().GetQueryable()
            .AnyAsync(sc => sc.Id == subCatId && sc.CategoryId == catId);
        return exists ? subCatId : null;
    }

    private async Task<int?> ValidateCollectionId(int? collectionId, int? subCatId)
    {
        if (collectionId == null || collectionId <= 0) return null;
        var exists = await _unitOfWork.Repository<Collection>().GetQueryable()
            .AnyAsync(c => c.Id == collectionId && (subCatId == null || c.SubCategoryId == subCatId));
        return exists ? collectionId : null;
    }

    private async Task<string> GenerateUniqueSlugAsync(string name)
    {
        var baseSlug = SlugHelper.GenerateSlug(name);
        var slug = baseSlug;
        int counter = 1;

        while (await _unitOfWork.Repository<Product>().GetQueryable().AnyAsync(p => p.Slug == slug))
        {
            var randomSuffix = Guid.NewGuid().ToString().Substring(0, 4);
            slug = $"{baseSlug}-{randomSuffix}";
            
            if (counter++ > 10) break; 
        }

        return slug;
    }
}

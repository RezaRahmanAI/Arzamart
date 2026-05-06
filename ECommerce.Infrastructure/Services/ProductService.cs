using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.Enums;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace ECommerce.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ICacheService _cache;

    public ProductService(IUnitOfWork unitOfWork, IMapper mapper, ICacheService cache)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<ProductDto?> GetProductBySlugAsync(string slug)
    {
        var cacheKey = $"product:details:slug:{slug}";
        
        return await _cache.GetOrCreateAsync(cacheKey, async () => 
        {
            var spec = new ProductsWithCategoriesSpecification(slug);
            var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec);
            var dto = _mapper.Map<Product, ProductDto>(product);
            return dto;
        }, TimeSpan.FromMinutes(60));
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id, bool ignoreFilters = false)
    {
        var cacheKey = $"product:details:id:{id}{(ignoreFilters ? "_ignoreFilters" : "")}";
        
        return await _cache.GetOrCreateAsync(cacheKey, async () => 
        {
            var spec = new ProductsWithCategoriesSpecification(id);
            var product = ignoreFilters 
                ? await _unitOfWork.Repository<Product>().GetEntityWithSpecIgnoreFiltersAsync(spec)
                : await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec);
                
            var dto = _mapper.Map<Product, ProductDto>(product);
            return dto;
        }, TimeSpan.FromMinutes(60));
    }

    public async Task<ProductDto?> CreateProductAsync(ProductCreateDto dto)
    {
        int.TryParse(dto.Category, out int catId);
        var category = await _unitOfWork.Repository<Category>().GetQueryable()
            .FirstOrDefaultAsync(c => c.Name.ToLower() == dto.Category.ToLower() || (catId != 0 && c.Id == catId));
        
        if (category == null) throw new KeyNotFoundException($"Category {dto.Category} not found");

        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            ShortDescription = dto.ShortDescription,
            StockQuantity = dto.InventoryVariants.Sum(v => v.Inventory),
            IsActive = dto.StatusActive,
            CategoryId = category.Id,
            ImageUrl = dto.Media?.MainImage?.ImageUrl ?? string.Empty,
            IsNew = dto.NewArrival,
            IsFeatured = dto.IsFeatured,
            Slug = await GenerateUniqueSlugAsync(dto.Name),
            Sku = $"PRD-{DateTime.UtcNow.Ticks}",
            FabricAndCare = dto.Meta?.FabricAndCare,
            ShippingAndReturns = dto.Meta?.ShippingAndReturns,
            SizeChartUrl = dto.Meta?.SizeChartUrl,
            Tier = dto.Tier,
            Tags = dto.Tags,
            SortOrder = dto.SortOrder,
            BundleSize = dto.BundleSize,
            SubCategoryId = await ValidateSubCategoryId(dto.SubCategoryId, category.Id),
            CollectionId = await ValidateCollectionId(dto.CollectionId, dto.SubCategoryId),
            ProductType = dto.ProductType,
            ProductGroupId = dto.ProductGroupId
        };

        _unitOfWork.Repository<Product>().Add(product);
        
        if (dto.Media?.MainImage != null)
        {
            product.Images.Add(new ProductImage {
                Url = dto.Media.MainImage.ImageUrl ?? string.Empty,
                AltText = dto.Media.MainImage.Alt,
                Label = dto.Media.MainImage.Label,
                MediaType = dto.Media.MainImage.Type ?? "image",
                IsMain = true
            });
        }

        foreach (var thumb in dto.Media?.Thumbnails ?? new())
        {
            product.Images.Add(new ProductImage {
                Url = thumb.ImageUrl ?? string.Empty,
                AltText = thumb.Alt,
                Label = thumb.Label,
                MediaType = thumb.Type ?? "image",
                IsMain = false
            });
        }
        if (dto.InventoryVariants != null)
        {
            foreach (var v in dto.InventoryVariants)
            {
                product.Variants.Add(new ProductVariant {
                    Sku = v.Sku,
                    Price = v.SalePrice ?? v.Price,
                    CompareAtPrice = v.SalePrice.HasValue ? v.Price : null,
                    PurchaseRate = v.PurchaseRate,
                    StockQuantity = v.Inventory,
                    Size = v.Label
                });
            }
        }

        if (dto.ProductType == ProductType.Combo && dto.ComboItems != null)
        {
            foreach (var ci in dto.ComboItems)
            {
                product.ComboItems.Add(new ComboItem
                {
                    ProductId = ci.ProductId,
                    ProductVariantId = ci.ProductVariantId,
                    Quantity = ci.Quantity
                });
            }
        }

        var result = await _unitOfWork.Complete();
        if (result <= 0) return null!;

        // Invalidate product lists
        await InvalidateProductCacheAsync(product);

        var dtoResult = _mapper.Map<Product, ProductDto>(product);
        return dtoResult;
    }

    public async Task<ProductDto?> UpdateProductAsync(int id, ProductUpdateDto dto, bool ignoreFilters = false)
    {
        var spec = new ProductsWithCategoriesSpecification(id);
        var product = ignoreFilters
            ? await _unitOfWork.Repository<Product>().GetEntityWithSpecIgnoreFiltersAsync(spec, track: true)
            : await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec, track: true);

        if (product == null) throw new KeyNotFoundException("Product not found");

        var oldSlug = product.Slug;
        int.TryParse(dto.Category, out int catId);
        var category = await _unitOfWork.Repository<Category>().GetQueryable()
            .FirstOrDefaultAsync(c => c.Name.ToLower() == dto.Category.ToLower() || (catId != 0 && c.Id == catId));
        
        if (category == null) throw new KeyNotFoundException($"Category {dto.Category} not found");

        product.Name = dto.Name;
        product.Description = dto.Description;
        product.ShortDescription = dto.ShortDescription;
        product.IsActive = dto.StatusActive;
        product.CategoryId = category.Id;
        product.ImageUrl = dto.Media?.MainImage?.ImageUrl ?? string.Empty;
        product.IsNew = dto.NewArrival;
        product.IsFeatured = dto.IsFeatured;
        product.FabricAndCare = dto.Meta?.FabricAndCare;
        product.ShippingAndReturns = dto.Meta?.ShippingAndReturns;
        product.SizeChartUrl = dto.Meta?.SizeChartUrl;
        product.Tier = dto.Tier;
        product.Tags = dto.Tags;
        product.SortOrder = dto.SortOrder;
        product.BundleSize = dto.BundleSize;
        product.SubCategoryId = await ValidateSubCategoryId(dto.SubCategoryId, category.Id);
        product.CollectionId = await ValidateCollectionId(dto.CollectionId, dto.SubCategoryId);
        product.ProductType = dto.ProductType;
        product.ProductGroupId = dto.ProductGroupId;

        // Sync images
        foreach (var img in product.Images.ToList()) _unitOfWork.Repository<ProductImage>().Delete(img);
        if (dto.Media?.MainImage != null)
        {
            product.Images.Add(new ProductImage {
                Url = dto.Media.MainImage.ImageUrl ?? string.Empty,
                AltText = dto.Media.MainImage.Alt,
                Label = dto.Media.MainImage.Label,
                MediaType = dto.Media.MainImage.Type ?? "image",
                IsMain = true
            });
        }
        foreach (var thumb in dto.Media?.Thumbnails ?? new())
        {
            product.Images.Add(new ProductImage {
                Url = thumb.ImageUrl ?? string.Empty,
                AltText = thumb.Alt,
                Label = thumb.Label,
                MediaType = thumb.Type ?? "image",
                IsMain = false
            });
        }

        // Sync variants
        foreach (var v in product.Variants.ToList()) _unitOfWork.Repository<ProductVariant>().Delete(v);
        foreach (var v in dto.InventoryVariants)
        {
            product.Variants.Add(new ProductVariant {
                Sku = v.Sku,
                Price = v.SalePrice ?? v.Price,
                CompareAtPrice = v.SalePrice.HasValue ? v.Price : null,
                PurchaseRate = v.PurchaseRate,
                StockQuantity = v.Inventory,
                Size = v.Label
            });
        }

        // Sync combo items
        foreach (var ci in product.ComboItems.ToList()) _unitOfWork.Repository<ComboItem>().Delete(ci);
        if (dto.ProductType == ProductType.Combo && dto.ComboItems != null)
        {
            foreach (var ci in dto.ComboItems)
            {
                product.ComboItems.Add(new ComboItem
                {
                    ProductId = ci.ProductId,
                    ProductVariantId = ci.ProductVariantId,
                    Quantity = ci.Quantity
                });
            }
        }

        product.StockQuantity = dto.InventoryVariants.Sum(v => v.Inventory);

        _unitOfWork.Repository<Product>().Update(product);
        await _unitOfWork.Complete();

        // Invalidate Product-specific cache and all lists
        await InvalidateProductCacheAsync(product, oldSlug);

        var dtoResult = _mapper.Map<Product, ProductDto>(product);
        return dtoResult;
    }

    private async Task InvalidateProductCacheAsync(Product product, string? oldSlug = null)
    {
        // 1. Details Invalidation
        await _cache.RemoveAsync($"product:details:id:{product.Id}");
        await _cache.RemoveAsync($"product:details:slug:{product.Slug}");
        if (!string.IsNullOrEmpty(oldSlug) && oldSlug != product.Slug)
        {
            await _cache.RemoveAsync($"product:details:slug:{oldSlug}");
        }

        // 2. List Invalidation (Wildcard)
        await _cache.RemoveByPrefixAsync("product:list");
        
        // 3. Homepage/Section Invalidation
        await _cache.RemoveAsync("homepage:featured-products");
        await _cache.RemoveAsync("homepage:new-arrivals");
        await _cache.RemoveAsync("home_page_data"); // Shared landing page data
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
        var baseSlug = GenerateSlug(name);
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

    private string GenerateSlug(string name)
    {
        if (string.IsNullOrEmpty(name)) return Guid.NewGuid().ToString().Substring(0, 8);
        
        var slug = name.ToLower().Trim();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-").Trim('-');
        
        if (slug.Length > 150) slug = slug.Substring(0, 150).Trim('-');
        
        return string.IsNullOrEmpty(slug) ? Guid.NewGuid().ToString().Substring(0, 8) : slug;
    }

    public async Task<List<string>> GetAvailableSizesAsync()
    {
        return await _cache.GetOrCreateAsync("product:sizes", async () => 
        {
            var sizes = await _unitOfWork.Repository<ProductVariant>()
                .GetQueryable()
                .Where(v => !string.IsNullOrEmpty(v.Size))
                .Select(v => v.Size!)
                .Distinct()
                .ToListAsync();

            var sizeOrder = new List<string> { 
                "2", "4", "6", "8", "10", "12", "14", "16",
                "28", "30", "32", "34", "36", "38", "40", "42", "44",
                "xs", "s", "m", "l", "xl", "xxl", "2xl", "xxxl", "3xl", "4xl", "5xl" 
            };

            return sizes.OrderBy(s => {
                var index = sizeOrder.IndexOf(s.ToLower());
                return index == -1 ? 999 : index;
            }).ThenBy(s => s).ToList();
        }, TimeSpan.FromHours(24));
    }
}

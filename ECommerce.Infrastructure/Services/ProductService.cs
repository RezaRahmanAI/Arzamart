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
using ECommerce.Core.Constants;
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
            if (dto != null)
            {
                dto.CategoryName = CategoryConstants.AllCategories.FirstOrDefault(c => c.Id == product.CategoryId)?.Name ?? "";
            }
            return dto;
        }, TimeSpan.FromMinutes(60));
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id)
    {
        var cacheKey = $"product:details:id:{id}";
        
        return await _cache.GetOrCreateAsync(cacheKey, async () => 
        {
            var spec = new ProductsWithCategoriesSpecification(id);
            var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec);
            var dto = _mapper.Map<Product, ProductDto>(product);
            if (dto != null)
            {
                dto.CategoryName = CategoryConstants.AllCategories.FirstOrDefault(c => c.Id == product.CategoryId)?.Name ?? "";
            }
            return dto;
        }, TimeSpan.FromMinutes(60));
    }

    public async Task<ProductDto?> CreateProductAsync(ProductCreateDto dto)
    {
        var category = CategoryConstants.AllCategories.FirstOrDefault(c => c.Name.Equals(dto.Category, StringComparison.OrdinalIgnoreCase) || c.Id.ToString() == dto.Category);
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
            Slug = GenerateSlug(dto.Name),
            Sku = $"PRD-{DateTime.UtcNow.Ticks}",
            FabricAndCare = dto.Meta?.FabricAndCare,
            ShippingAndReturns = dto.Meta?.ShippingAndReturns,
            Tier = dto.Tier,
            Tags = dto.Tags,
            SortOrder = dto.SortOrder,
            SubCategoryId = dto.SubCategoryId,
            CollectionId = dto.CollectionId,
            ProductType = dto.ProductType,
            IsBundle = dto.IsBundle,
            BundleQuantity = dto.BundleQuantity > 0 ? dto.BundleQuantity : 1
        };

        _unitOfWork.Repository<Product>().Add(product);
        
        // Handle Images & Variants ... (omitted for brevity in instruction but keep logic)
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

        var result = await _unitOfWork.Complete();
        if (result <= 0) return null!;

        // Invalidate product lists
        await InvalidateProductCacheAsync(product);

        var dtoResult = _mapper.Map<Product, ProductDto>(product);
        if (dtoResult != null)
        {
            dtoResult.CategoryName = CategoryConstants.AllCategories.FirstOrDefault(c => c.Id == product.CategoryId)?.Name ?? "";
        }
        return dtoResult;
    }

    public async Task<ProductDto?> UpdateProductAsync(int id, ProductUpdateDto dto)
    {
        var spec = new ProductsWithCategoriesSpecification(id);
        var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec);

        if (product == null) throw new KeyNotFoundException("Product not found");

        var oldSlug = product.Slug;
        var category = CategoryConstants.AllCategories.FirstOrDefault(c => c.Name.Equals(dto.Category, StringComparison.OrdinalIgnoreCase) || c.Id.ToString() == dto.Category);
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
        product.Tier = dto.Tier;
        product.Tags = dto.Tags;
        product.SortOrder = dto.SortOrder;
        product.SubCategoryId = dto.SubCategoryId;
        product.CollectionId = dto.CollectionId;
        product.ProductType = dto.ProductType;
        product.IsBundle = dto.IsBundle;
        product.BundleQuantity = dto.BundleQuantity > 0 ? dto.BundleQuantity : 1;

        // Sync images and variants ... (keep existing logic)
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

        product.StockQuantity = dto.InventoryVariants.Sum(v => v.Inventory);

        _unitOfWork.Repository<Product>().Update(product);
        await _unitOfWork.Complete();

        // Invalidate Product-specific cache and all lists
        await InvalidateProductCacheAsync(product, oldSlug);

        var dtoResult = _mapper.Map<Product, ProductDto>(product);
        if (dtoResult != null)
        {
            dtoResult.CategoryName = CategoryConstants.AllCategories.FirstOrDefault(c => c.Id == product.CategoryId)?.Name ?? "";
        }
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

    private string GenerateSlug(string name)
    {
        if (string.IsNullOrEmpty(name)) return Guid.NewGuid().ToString();
        var slug = name.ToLower().Trim()
            .Replace(" ", "-").Replace("/", "-").Replace("&", "and");
        return slug.Length > 100 ? slug.Substring(0, 100) : slug;
    }

    public async Task<List<string>> GetAvailableSizesAsync()
    {
        return await _cache.GetOrCreateAsync("product:sizes", async () => 
        {
            return await _unitOfWork.Repository<ProductVariant>()
                .GetQueryable()
                .Where(v => !string.IsNullOrEmpty(v.Size))
                .Select(v => v.Size!)
                .Distinct()
                .OrderBy(s => s)
                .ToListAsync();
        }, TimeSpan.FromHours(24));
    }
}

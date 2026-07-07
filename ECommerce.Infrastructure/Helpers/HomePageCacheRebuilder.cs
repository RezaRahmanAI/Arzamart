using System.Collections.Generic;
using System.Linq;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Enums;
using ECommerce.Infrastructure.Cache;

namespace ECommerce.Infrastructure.Helpers;

public static class HomePageCacheRebuilder
{
    public static void Rebuild(AppCache cache)
    {
        var banners = cache.Banners.Values
            .Where(b => b.IsActive)
            .OrderBy(b => b.DisplayOrder)
            .Select(b => new HeroBannerDto
            {
                Id = b.Id,
                Title = b.Title ?? "",
                Subtitle = b.Subtitle ?? "",
                ImageUrl = b.ImageUrl,
                MobileImageUrl = b.MobileImageUrl ?? "",
                LinkUrl = b.LinkUrl ?? "",
                ButtonText = b.ButtonText ?? "",
                DisplayOrder = b.DisplayOrder,
                Type = b.Type
            })
            .ToList();

        var categories = cache.Categories.Values
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .Take(10)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                ImageUrl = c.ImageUrl,
                DisplayOrder = c.DisplayOrder,
                ProductCount = c.Products.Count,
                IsActive = c.IsActive,
                SubCategories = c.SubCategories?
                    .Where(sc => sc.IsActive)
                    .OrderBy(sc => sc.DisplayOrder)
                    .Select(sc => new SubCategoryDto
                    {
                        Id = sc.Id,
                        Name = sc.Name,
                        Slug = sc.Slug,
                        ImageUrl = sc.ImageUrl,
                        CategoryId = sc.CategoryId,
                        IsActive = sc.IsActive,
                        DisplayOrder = sc.DisplayOrder,
                        Collections = sc.Collections?
                            .Where(col => col.IsActive)
                            .Select(col => new CollectionDto
                            {
                                Id = col.Id,
                                Name = col.Name,
                                Slug = col.Slug,
                                Description = col.Description,
                                ImageUrl = col.ImageUrl,
                                SubCategoryId = col.SubCategoryId,
                                IsActive = col.IsActive
                            }).ToList() ?? new List<CollectionDto>()
                    }).ToList() ?? new List<SubCategoryDto>()
            })
            .ToList();

        var featuredProducts = cache.Products.Values
            .Where(p => p.IsActive && p.IsFeatured)
            .OrderBy(p => p.SortOrder)
            .Take(12)
            .Select(p => MapToProductListDto(p))
            .ToList();

        var newArrivals = cache.Products.Values
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .Take(12)
            .Select(p => MapToProductListDto(p))
            .ToList();

        cache.HomePageData["homepage"] = new HomePageDto
        {
            Banners = banners,
            Categories = categories,
            FeaturedProducts = featuredProducts,
            NewArrivals = newArrivals
        };
    }

    public static ProductListDto MapToProductListDto(Product p)
    {
        return new ProductListDto
        {
            Id = p.Id,
            Name = p.Name,
            Slug = p.Slug,
            Description = p.Description,
            ShortDescription = p.ShortDescription,
            Price = p.Variants.Any(v => v.Price > 0)
                ? p.Variants.Where(v => v.Price > 0).Min(v => v.Price) ?? 0
                : (p.Variants.FirstOrDefault()?.Price ?? 0),
            CompareAtPrice = p.Variants.Any(v => v.Price > 0)
                ? p.Variants.Where(v => v.Price > 0).Max(v => v.CompareAtPrice)
                : p.Variants.FirstOrDefault()?.CompareAtPrice,
            ImageUrl = p.ImageUrl ?? string.Empty,
            CategoryName = p.Category?.Name ?? string.Empty,
            IsNew = p.IsNew,
            IsFeatured = p.IsFeatured,
            IsActive = p.IsActive,
            IsItemProduct = p.ProductType == ProductType.Simple,
            Tier = p.Tier,
            Tags = p.Tags,
            SortOrder = p.SortOrder,
            BundleSize = p.BundleSize,
            CollectionName = p.Collection?.Name,
            SubCategoryName = p.SubCategory?.Name,
            ProductGroupId = p.ProductGroupId,
            Variants = p.Variants.Select(v => new ProductVariantDto
            {
                Id = v.Id,
                Sku = v.Sku,
                Size = v.Size,
                Price = v.Price,
                CompareAtPrice = v.CompareAtPrice,
                StockQuantity = v.StockQuantity
            }).ToList(),
            Images = p.Images.Select(i => new ProductImageDto
            {
                Id = i.Id,
                ImageUrl = i.Url,
                AltText = i.AltText,
                Label = i.Label,
                IsPrimary = i.IsMain,
                Type = i.MediaType ?? "image"
            })
        };
    }
}

using System.Collections.Generic;
using System.Linq;
using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Auth;
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
                IsActive = c.IsActive
            })
            .ToList();

        var featuredProducts = cache.Products.Values
            .Where(p => p.IsActive && p.IsFeatured)
            .OrderBy(p => p.SortOrder)
            .Take(12)
            .Select(p => new ProductListDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                ImageUrl = p.ImageUrl ?? "",
                Price = p.Variants.Any(v => v.Price > 0)
                    ? p.Variants.Where(v => v.Price > 0).Min(v => v.Price) ?? 0
                    : (p.Variants.FirstOrDefault()?.Price ?? 0),
                CompareAtPrice = p.Variants.Any(v => v.Price > 0)
                    ? p.Variants.Where(v => v.Price > 0).Max(v => v.CompareAtPrice)
                    : p.Variants.FirstOrDefault()?.CompareAtPrice,
                IsFeatured = p.IsFeatured,
                IsActive = p.IsActive,
                IsNew = p.IsNew,
                CategoryName = p.Category?.Name ?? "",
                SortOrder = p.SortOrder
            })
            .ToList();

        var newArrivals = cache.Products.Values
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .Take(12)
            .Select(p => new ProductListDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                ImageUrl = p.ImageUrl ?? "",
                Price = p.Variants.Any(v => v.Price > 0)
                    ? p.Variants.Where(v => v.Price > 0).Min(v => v.Price) ?? 0
                    : (p.Variants.FirstOrDefault()?.Price ?? 0),
                CompareAtPrice = p.Variants.Any(v => v.Price > 0)
                    ? p.Variants.Where(v => v.Price > 0).Max(v => v.CompareAtPrice)
                    : p.Variants.FirstOrDefault()?.CompareAtPrice,
                IsFeatured = p.IsFeatured,
                IsActive = p.IsActive,
                IsNew = p.IsNew,
                CategoryName = p.Category?.Name ?? "",
                SortOrder = p.SortOrder
            })
            .ToList();

        cache.HomePageData["homepage"] = new HomePageDto
        {
            Banners = banners,
            Categories = categories,
            FeaturedProducts = featuredProducts,
            NewArrivals = newArrivals
        };
        cache.IncrementVersion("homepage");
    }
}

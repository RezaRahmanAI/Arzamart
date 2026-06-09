using System.Collections.Concurrent;
using System.Collections.Generic;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;

namespace ECommerce.Infrastructure.Cache;

/// <summary>
/// Singleton in-memory cache for all public-facing read data.
/// Thread-safe via ConcurrentDictionary. Populated at startup by CacheWarmupService.
/// Updated in-place on every admin Create/Update/Delete operation.
/// No TTL — data is permanent until explicitly replaced or app restarts.
/// </summary>
public class AppCache
{
    // ─── Products ───────────────────────────────────────────────
    /// Key: Product.Id — includes Images, Variants, Category
    public ConcurrentDictionary<int, Product> Products { get; } = new();

    // ─── Categories ─────────────────────────────────────────────
    /// Key: Category.Id — includes nested SubCategories
    public ConcurrentDictionary<int, Category> Categories { get; } = new();

    /// Key: SubCategory.Id — flat list for O(1) subcategory lookup
    public ConcurrentDictionary<int, SubCategory> SubCategories { get; } = new();

    // ─── Banners ─────────────────────────────────────────────────
    /// Key: HeroBanner.Id — active banners only, ordered by DisplayOrder
    public ConcurrentDictionary<int, HeroBanner> Banners { get; } = new();

    // ─── Navigation Menu ─────────────────────────────────────────
    /// Key: "main" — single prebuilt MegaMenuCategoryDto list
    public ConcurrentDictionary<string, List<MegaMenuCategoryDto>> NavigationMenus { get; } = new();

    // ─── Site Settings ────────────────────────────────────────────
    /// Key: "settings" — single entry including DeliveryMethods
    public ConcurrentDictionary<string, SiteSettingsDto> SiteSettings { get; } = new();

    // ─── Product Groups ───────────────────────────────────────────
    /// Key: ProductGroup.Id — active groups with product references
    public ConcurrentDictionary<int, ProductGroup> ProductGroups { get; } = new();

    // ─── HomePage Composite ───────────────────────────────────────
    /// Key: "homepage" — prebuilt HomePageDto, rebuilt on any dependency change
    public ConcurrentDictionary<string, HomePageDto> HomePageData { get; } = new();
}

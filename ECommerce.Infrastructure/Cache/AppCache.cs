using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
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
    /// <summary>
    /// Lock object for atomic cache rebuilds. Acquire this before Clear+Repopulate sequences
    /// to prevent readers from seeing an empty/partially-populated cache.
    /// </summary>
    public object RebuildLock { get; } = new();

    private readonly Timer _securityCleanupTimer;

    public AppCache()
    {
        _securityCleanupTimer = new Timer(_ => CleanExpiredSecurityFlags(), null, TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(1));
    }

    // ─── Products ───────────────────────────────────────────────
    /// Key: Product.Id — includes Images, Variants, Category
    public ConcurrentDictionary<int, Product> Products { get; } = new();

    /// Key: Product.Slug — maps slug to Product.Id for O(1) lookup
    public ConcurrentDictionary<string, int> ProductSlugIndex { get; } = new();

    // ─── Categories ─────────────────────────────────────────────
    /// Key: Category.Id — includes nested SubCategories
    public ConcurrentDictionary<int, Category> Categories { get; } = new();



    // ─── Banners ─────────────────────────────────────────────────
    /// Key: HeroBanner.Id — active banners only, ordered by DisplayOrder
    public ConcurrentDictionary<int, HeroBanner> Banners { get; } = new();

    // ─── Navigation Menu ─────────────────────────────────────────
    /// Key: "main" — single prebuilt MegaMenuCategoryDto list
    public ConcurrentDictionary<string, List<MegaMenuCategoryDto>> NavigationMenus { get; } = new();

    // ─── Site Settings ────────────────────────────────────────────
    /// Key: "settings" — single entry including DeliveryMethods
    public ConcurrentDictionary<string, SiteSettingsDto> SiteSettings { get; } = new();



    // ─── HomePage Composite ───────────────────────────────────────
    /// Key: "homepage" — prebuilt HomePageDto, rebuilt on any dependency change
    public ConcurrentDictionary<string, HomePageDto> HomePageData { get; } = new();

    // ─── Security Flags (TTL-based) ──────────────────────────────
    public ConcurrentDictionary<string, bool> SecurityFlags { get; } = new();
    private readonly ConcurrentDictionary<string, DateTime> _securityExpiry = new();

    public void SetSecurityFlag(string key, bool value, TimeSpan ttl)
    {
        SecurityFlags[key] = value;
        _securityExpiry[key] = DateTime.UtcNow.Add(ttl);
    }

    public bool? GetSecurityFlag(string key)
    {
        if (_securityExpiry.TryGetValue(key, out var expiry) && DateTime.UtcNow < expiry)
            return SecurityFlags.TryGetValue(key, out var val) ? val : null;
        _securityExpiry.TryRemove(key, out _);
        SecurityFlags.TryRemove(key, out _);
        return null;
    }

    public void ClearSecurityByPrefix(string prefix)
    {
        foreach (var key in _securityExpiry.Keys.Where(k => k.StartsWith(prefix)).ToList())
        {
            _securityExpiry.TryRemove(key, out _);
            SecurityFlags.TryRemove(key, out _);
        }
    }

    public void CleanExpiredSecurityFlags()
    {
        var now = DateTime.UtcNow;
        foreach (var key in _securityExpiry.Keys.Where(k => _securityExpiry[k] < now).ToList())
        {
            _securityExpiry.TryRemove(key, out _);
            SecurityFlags.TryRemove(key, out _);
        }
    }
}

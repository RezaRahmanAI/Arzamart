using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Enums;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ECommerce.Infrastructure.Helpers;

namespace ECommerce.Infrastructure.Cache;

/// <summary>
/// IHostedService — runs once at app startup.
/// Uses IServiceScopeFactory to safely resolve scoped DbContext from singleton context.
/// </summary>
public class CacheWarmupService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly AppCache _cache;
    private readonly ILogger<CacheWarmupService> _logger;

    public CacheWarmupService(
        IServiceScopeFactory scopeFactory,
        AppCache cache,
        ILogger<CacheWarmupService> logger)
    {
        _scopeFactory = scopeFactory;
        _cache = cache;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("[AppCache] Warmup starting...");
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var warmups = new (string Name, Func<Task> Action)[]
        {
            ("Products", () => WarmUpProductsAsync(db, cancellationToken)),
            ("Categories", () => WarmUpCategoriesAsync(db, cancellationToken)),
            ("Banners", () => WarmUpBannersAsync(db, cancellationToken)),
            ("Navigation", () => WarmUpNavigationAsync(db, cancellationToken)),
            ("SiteSettings", () => WarmUpSiteSettingsAsync(db, cancellationToken)),
        };

        foreach (var (name, action) in warmups)
        {
            try
            {
                await action();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AppCache] Warmup failed for {Name}", name);
            }
        }

        try
        {
            WarmUpHomePage();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AppCache] Warmup failed for HomePage");
        }

        _logger.LogInformation(
            "[AppCache] Warmup complete. Products={P}, Categories={C}, Banners={B}",
            _cache.Products.Count,
            _cache.Categories.Count,
            _cache.Banners.Count);

        // Seed initial cache versions
        _cache.CacheVersions["products"] = 1;
        _cache.CacheVersions["categories"] = 1;
        _cache.CacheVersions["banners"] = 1;
        _cache.CacheVersions["navigation"] = 1;
        _cache.CacheVersions["settings"] = 1;
        _cache.CacheVersions["homepage"] = 1;
        _cache.CacheVersions["subcategories"] = 1;
        _cache.CacheVersions["productgroups"] = 1;

        _cache.LastWarmupTime = DateTime.UtcNow;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task WarmUpProductsAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var products = await db.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .Include(p => p.Collection)
            .Include(p => p.ComboItems).ThenInclude(ci => ci.Product)
            .Include(p => p.ComboItems).ThenInclude(ci => ci.ProductVariant)
            .AsSplitQuery()
            .ToListAsync(ct);
        foreach (var p in products)
        {
            _cache.Products[p.Id] = p;
            if (!string.IsNullOrEmpty(p.Slug))
                _cache.ProductSlugIndex[p.Slug] = p.Id;
        }
    }

    private async Task WarmUpCategoriesAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var categories = await db.Categories
            .AsNoTracking()
            .Include(c => c.SubCategories)
                .ThenInclude(sc => sc.Collections)
            .ToListAsync(ct);
        foreach (var c in categories) _cache.Categories[c.Id] = c;
    }

    private async Task WarmUpBannersAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var banners = await db.HeroBanners
            .AsNoTracking()
            .OrderBy(b => b.DisplayOrder)
            .ToListAsync(ct);
        foreach (var b in banners) _cache.Banners[b.Id] = b;
    }

    private async Task WarmUpNavigationAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var navItems = await db.NavigationMenus
            .AsNoTracking()
            .Include(n => n.ChildMenus)
            .OrderBy(n => n.DisplayOrder)
            .ToListAsync(ct);

        var megaMenuCategories = BuildMegaMenuCategories(navItems);
        _cache.NavigationMenus["main"] = megaMenuCategories;
    }

    private async Task WarmUpSiteSettingsAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var settings = await db.SiteSettings.AsNoTracking().FirstOrDefaultAsync(ct);
        var deliveryMethods = await db.DeliveryMethods.AsNoTracking().ToListAsync(ct);

        var deliveryMethodDtos = deliveryMethods.Select(dm => new DeliveryMethodDto
        {
            Id = dm.Id,
            Name = dm.Name,
            Cost = dm.Cost,
            EstimatedDays = dm.EstimatedDays,
            DeliveryZoneId = dm.DeliveryZoneId,
            IsActive = dm.IsActive
        }).ToList();

        if (settings != null)
        {
            _cache.SiteSettings["settings"] = new SiteSettingsDto
            {
                WebsiteName = settings.WebsiteName,
                LogoUrl = settings.LogoUrl,
                ContactEmail = settings.ContactEmail,
                ContactPhone = settings.ContactPhone,
                Address = settings.Address,
                FacebookUrl = settings.FacebookUrl,
                InstagramUrl = settings.InstagramUrl,
                TwitterUrl = settings.TwitterUrl,
                YoutubeUrl = settings.YoutubeUrl,
                WhatsAppNumber = settings.WhatsAppNumber,
                Currency = settings.Currency,
                FreeShippingThreshold = settings.FreeShippingThreshold,
                ShippingCharge = settings.ShippingCharge,
                FacebookPixelId = settings.FacebookPixelId,
                GoogleTagId = settings.GoogleTagId,
                SizeGuideImageUrl = settings.SizeGuideImageUrl,
                FaviconUrl = settings.FaviconUrl,
                DeliveryMethods = deliveryMethodDtos
            };
        }
    }



    public void WarmUpHomePage()
    {
        HomePageCacheRebuilder.Rebuild(_cache);
    }

    private static List<MegaMenuCategoryDto> BuildMegaMenuCategories(
        List<NavigationMenu> rootMenus)
    {
        return rootMenus
            .Where(n => n.ParentMenuId == null)
            .OrderBy(n => n.DisplayOrder)
            .Select(n => new MegaMenuCategoryDto
            {
                Id = n.Id,
                Name = n.Title,
                Slug = n.Url ?? string.Empty,
                Icon = n.Icon,
                SubCategories = n.ChildMenus
                    .Where(c => c.ParentMenuId == n.Id)
                    .OrderBy(c => c.DisplayOrder)
                    .Select(c => new MegaMenuSubCategoryDto
                    {
                        Id = c.Id,
                        Name = c.Title,
                        Slug = c.Url ?? string.Empty,
                        Collections = c.ChildMenus
                            .Where(cc => cc.ParentMenuId == c.Id)
                            .OrderBy(cc => cc.DisplayOrder)
                            .Select(cc => new MegaMenuCollectionDto
                            {
                                Id = cc.Id,
                                Name = cc.Title,
                                Slug = cc.Url ?? string.Empty
                            })
                            .ToList()
                    })
                    .ToList()
            })
            .ToList();
    }
}

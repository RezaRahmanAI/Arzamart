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
                DeliveryMethods = deliveryMethodDtos
            };
        }
    }



    public void WarmUpHomePage()
    {
        var homeDto = new HomePageDto
        {
            Banners = _cache.Banners.Values
                .OrderBy(b => b.DisplayOrder)
                .Select(b => new HeroBannerDto
                {
                    Id = b.Id,
                    Title = b.Title ?? string.Empty,
                    Subtitle = b.Subtitle ?? string.Empty,
                    ImageUrl = b.ImageUrl,
                    MobileImageUrl = b.MobileImageUrl ?? string.Empty,
                    LinkUrl = b.LinkUrl ?? string.Empty,
                    ButtonText = b.ButtonText ?? string.Empty,
                    DisplayOrder = b.DisplayOrder,
                    Type = b.Type
                })
                .ToList(),
            Categories = _cache.Categories.Values
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
                    IsActive = c.IsActive
                })
                .ToList(),
            FeaturedProducts = _cache.Products.Values
                .Where(p => p.IsFeatured && p.IsActive)
                .OrderBy(p => p.SortOrder)
                .Take(12)
                .Select(p => MapToProductListDto(p))
                .ToList(),
            NewArrivals = _cache.Products.Values
                .Where(p => p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .Take(12)
                .Select(p => MapToProductListDto(p))
                .ToList()
        };
        _cache.HomePageData["homepage"] = homeDto;
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

    private static ProductListDto MapToProductListDto(Product p)
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

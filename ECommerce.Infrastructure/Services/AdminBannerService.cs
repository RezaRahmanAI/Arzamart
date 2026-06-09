using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Cache;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ECommerce.Infrastructure.Services;

public class AdminBannerService : IAdminBannerService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppCache _cache;
    private readonly IServiceScopeFactory _scopeFactory;

    public AdminBannerService(IUnitOfWork unitOfWork, AppCache cache, IServiceScopeFactory scopeFactory)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
        _scopeFactory = scopeFactory;
    }

    public async Task<List<HeroBannerDto>> GetAllAsync()
    {
        return await _unitOfWork.Repository<HeroBanner>()
            .GetQueryable()
            .AsNoTracking()
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
            .ToListAsync();
    }

    public async Task<HeroBannerDto?> GetByIdAsync(int id)
    {
        var banner = await _unitOfWork.Repository<HeroBanner>()
            .GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (banner == null) return null;

        return new HeroBannerDto
        {
            Id = banner.Id,
            Title = banner.Title ?? "",
            Subtitle = banner.Subtitle ?? "",
            ImageUrl = banner.ImageUrl,
            MobileImageUrl = banner.MobileImageUrl ?? "",
            LinkUrl = banner.LinkUrl ?? "",
            ButtonText = banner.ButtonText ?? "",
            DisplayOrder = banner.DisplayOrder,
            Type = banner.Type
        };
    }

    public async Task<HeroBannerDto> CreateAsync(CreateHeroBannerDto dto)
    {
        var banner = new HeroBanner
        {
            Title = dto.Title,
            Subtitle = dto.Subtitle,
            ImageUrl = dto.ImageUrl,
            MobileImageUrl = dto.MobileImageUrl,
            LinkUrl = dto.LinkUrl,
            ButtonText = dto.ButtonText,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive,
            Type = dto.Type
        };

        _unitOfWork.Repository<HeroBanner>().Add(banner);
        await _unitOfWork.Complete();

        _cache.Banners[banner.Id] = banner;
        RebuildHomePageCache();

        return new HeroBannerDto
        {
            Id = banner.Id,
            Title = banner.Title ?? "",
            Subtitle = banner.Subtitle ?? "",
            ImageUrl = banner.ImageUrl,
            MobileImageUrl = banner.MobileImageUrl ?? "",
            LinkUrl = banner.LinkUrl ?? "",
            ButtonText = banner.ButtonText ?? "",
            DisplayOrder = banner.DisplayOrder,
            Type = banner.Type
        };
    }

    public async Task<HeroBannerDto> UpdateAsync(int id, CreateHeroBannerDto dto)
    {
        var banner = await _unitOfWork.Repository<HeroBanner>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (banner == null)
            throw new InvalidOperationException($"Banner with ID {id} not found");

        banner.Title = dto.Title;
        banner.Subtitle = dto.Subtitle;
        banner.ImageUrl = dto.ImageUrl;
        banner.MobileImageUrl = dto.MobileImageUrl;
        banner.LinkUrl = dto.LinkUrl;
        banner.ButtonText = dto.ButtonText;
        banner.DisplayOrder = dto.DisplayOrder;
        banner.IsActive = dto.IsActive;
        banner.Type = dto.Type;
        banner.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();

        _cache.Banners[id] = banner;
        RebuildHomePageCache();

        return new HeroBannerDto
        {
            Id = banner.Id,
            Title = banner.Title ?? "",
            Subtitle = banner.Subtitle ?? "",
            ImageUrl = banner.ImageUrl,
            MobileImageUrl = banner.MobileImageUrl ?? "",
            LinkUrl = banner.LinkUrl ?? "",
            ButtonText = banner.ButtonText ?? "",
            DisplayOrder = banner.DisplayOrder,
            Type = banner.Type
        };
    }

    public async Task DeleteAsync(int id)
    {
        var banner = await _unitOfWork.Repository<HeroBanner>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (banner == null)
            throw new InvalidOperationException($"Banner with ID {id} not found");

        _unitOfWork.Repository<HeroBanner>().Delete(banner);
        await _unitOfWork.Complete();

        _cache.Banners.TryRemove(id, out _);
        RebuildHomePageCache();
    }

    private void RebuildHomePageCache()
    {
        var banners = _cache.Banners.Values
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

        var categories = _cache.Categories.Values
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

        var featuredProducts = _cache.Products.Values
            .Where(p => p.IsActive && p.IsFeatured)
            .OrderBy(p => p.SortOrder)
            .Take(12)
            .Select(p => new ProductListDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                ImageUrl = p.ImageUrl ?? "",
                Price = p.Variants.FirstOrDefault()?.Price ?? 0,
                CompareAtPrice = p.Variants.FirstOrDefault()?.CompareAtPrice,
                IsFeatured = p.IsFeatured,
                IsActive = p.IsActive,
                IsNew = p.IsNew,
                CategoryName = p.Category?.Name ?? "",
                SortOrder = p.SortOrder
            })
            .ToList();

        var newArrivals = _cache.Products.Values
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .Take(12)
            .Select(p => new ProductListDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                ImageUrl = p.ImageUrl ?? "",
                Price = p.Variants.FirstOrDefault()?.Price ?? 0,
                CompareAtPrice = p.Variants.FirstOrDefault()?.CompareAtPrice,
                IsFeatured = p.IsFeatured,
                IsActive = p.IsActive,
                IsNew = p.IsNew,
                CategoryName = p.Category?.Name ?? "",
                SortOrder = p.SortOrder
            })
            .ToList();

        _cache.HomePageData["homepage"] = new HomePageDto
        {
            Banners = banners,
            Categories = categories,
            FeaturedProducts = featuredProducts,
            NewArrivals = newArrivals
        };
    }
}

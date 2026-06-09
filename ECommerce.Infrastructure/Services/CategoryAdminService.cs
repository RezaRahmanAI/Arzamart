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

public class CategoryAdminService : ICategoryAdminService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppCache _cache;
    private readonly IServiceScopeFactory _scopeFactory;

    public CategoryAdminService(IUnitOfWork unitOfWork, AppCache cache, IServiceScopeFactory scopeFactory)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
        _scopeFactory = scopeFactory;
    }

    public async Task<List<CategoryDto>> GetAllAsync()
    {
        var categories = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .AsNoTracking()
            .Include(c => c.SubCategories)
                .ThenInclude(sc => sc.Collections)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();

        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            ImageUrl = c.ImageUrl,
            IsActive = c.IsActive,
            DisplayOrder = c.DisplayOrder,
            MetaTitle = c.MetaTitle,
            MetaDescription = c.MetaDescription,
            CreatedAt = c.CreatedAt,
            ParentId = c.ParentId,
            SubCategories = c.SubCategories.Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                CategoryId = sc.CategoryId,
                IsActive = sc.IsActive,
                ImageUrl = sc.ImageUrl,
                DisplayOrder = sc.DisplayOrder,
                Collections = sc.Collections.Select(col => new CollectionDto
                {
                    Id = col.Id,
                    Name = col.Name,
                    Slug = col.Slug
                }).ToList()
            }).ToList()
        }).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var c = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .AsNoTracking()
            .Include(c => c.SubCategories)
                .ThenInclude(sc => sc.Collections)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (c == null) return null;

        return new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            ImageUrl = c.ImageUrl,
            IsActive = c.IsActive,
            DisplayOrder = c.DisplayOrder,
            MetaTitle = c.MetaTitle,
            MetaDescription = c.MetaDescription,
            CreatedAt = c.CreatedAt,
            ParentId = c.ParentId,
            SubCategories = c.SubCategories.Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                CategoryId = sc.CategoryId,
                IsActive = sc.IsActive,
                ImageUrl = sc.ImageUrl,
                DisplayOrder = sc.DisplayOrder,
                Collections = sc.Collections.Select(col => new CollectionDto
                {
                    Id = col.Id,
                    Name = col.Name,
                    Slug = col.Slug
                }).ToList()
            }).ToList()
        };
    }

    public async Task<CategoryDto> CreateAsync(CategoryCreateDto dto)
    {
        var slug = string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Name) : dto.Slug;

        var slugExists = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .AnyAsync(c => c.Slug == slug);

        if (slugExists)
            throw new InvalidOperationException("A category with this slug already exists");

        var category = new Category
        {
            Name = dto.Name,
            Slug = slug,
            ImageUrl = dto.ImageUrl,
            MetaTitle = dto.MetaTitle,
            MetaDescription = dto.MetaDescription,
            IsActive = dto.IsActive ?? true,
            DisplayOrder = dto.DisplayOrder ?? 0,
            ParentId = dto.ParentId
        };

        _unitOfWork.Repository<Category>().Add(category);
        await _unitOfWork.Complete();

        RebuildCategoryCache();

        return await GetByIdAsync(category.Id) ?? throw new InvalidOperationException("Failed to retrieve created category");
    }

    public async Task UpdateAsync(int id, CategoryUpdateDto dto)
    {
        var category = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            throw new InvalidOperationException($"Category with ID {id} not found");

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            category.Name = dto.Name;
            if (string.IsNullOrWhiteSpace(dto.Slug))
                category.Slug = GenerateSlug(dto.Name);
        }

        if (!string.IsNullOrWhiteSpace(dto.Slug))
        {
            var slug = dto.Slug.ToLower().Replace(" ", "-");
            var slugExists = await _unitOfWork.Repository<Category>()
                .GetQueryable()
                .AnyAsync(c => c.Slug == slug && c.Id != id);

            if (slugExists)
                throw new InvalidOperationException("A category with this slug already exists");

            category.Slug = slug;
        }

        category.ImageUrl = dto.ImageUrl;
        category.MetaTitle = dto.MetaTitle;
        category.MetaDescription = dto.MetaDescription;
        category.IsActive = dto.IsActive ?? category.IsActive;
        category.DisplayOrder = dto.DisplayOrder ?? category.DisplayOrder;
        category.ParentId = dto.ParentId;
        category.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();

        RebuildCategoryCache();
    }

    public async Task DeleteAsync(int id)
    {
        var category = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .Include(c => c.SubCategories)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            throw new InvalidOperationException($"Category with ID {id} not found");

        if (category.SubCategories.Any() || category.Products.Any())
            throw new InvalidOperationException("Cannot delete category that has sub-categories or products. Please delete or move them first.");

        _unitOfWork.Repository<Category>().Delete(category);
        await _unitOfWork.Complete();

        RebuildCategoryCache();
    }

    public async Task ReorderAsync(List<int> sortedIds)
    {
        if (sortedIds == null || sortedIds.Count == 0)
            throw new InvalidOperationException("No IDs provided");

        var categories = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .ToListAsync();

        for (int i = 0; i < sortedIds.Count; i++)
        {
            var cat = categories.FirstOrDefault(c => c.Id == sortedIds[i]);
            if (cat != null)
            {
                cat.DisplayOrder = i;
            }
        }

        await _unitOfWork.Complete();

        RebuildCategoryCache();
    }

    private void RebuildCategoryCache()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var cats = db.Categories
            .AsNoTracking()
            .Include(c => c.SubCategories)
                .ThenInclude(sc => sc.Collections)
            .ToList();

        _cache.Categories.Clear();
        foreach (var c in cats)
            _cache.Categories[c.Id] = c;

        var subs = db.SubCategories.AsNoTracking().ToList();
        _cache.SubCategories.Clear();
        foreach (var s in subs)
            _cache.SubCategories[s.Id] = s;

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

    private static string GenerateSlug(string name)
    {
        return name.ToLower()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("\"", "")
            .Replace("'", "");
    }
}

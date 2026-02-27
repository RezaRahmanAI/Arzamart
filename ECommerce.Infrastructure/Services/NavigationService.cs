using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.Infrastructure.Services;

public class NavigationService : INavigationService
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private const string MegaMenuCacheKey = "MegaMenu";

    public NavigationService(ApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<MegaMenuDto> GetMegaMenuAsync()
    {
        return await _cache.GetOrCreateAsync(MegaMenuCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(60);

            // Fetch categories with full hierarchy: Parent -> Child -> Collections (if any connected)
            // We are transitioning from Category -> SubCategory to Category -> ChildCategory
            // To maintain frontend compatibility, we map ChildCategories to "SubCategories" in the DTO.

            var allCategories = await _context.Categories
                .AsNoTracking()
                .Include(c => c.SubCategories) // Include legacy subcategories for now
                    .ThenInclude(sc => sc.Collections)
                .Include(c => c.ChildCategories) // Include new recursive children
                    .ThenInclude(cc => cc.Collections) // Fix: Include Collections for child categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            // Top level categories are those with no parent
            var rootCategories = allCategories.Where(c => c.ParentId == null).ToList();

            var menuDto = new MegaMenuDto
            {
                Categories = rootCategories.Select(c => new MegaMenuCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Icon = c.Icon,
                    // Combine legacy SubCategories and new ChildCategories into the single "SubCategories" list for frontend
                    SubCategories = MapChildrenToSubCategories(c)
                })
            };

            return menuDto;
        }) ?? new MegaMenuDto();
    }

    private IEnumerable<MegaMenuSubCategoryDto> MapChildrenToSubCategories(Category parent)
    {
        var result = new List<MegaMenuSubCategoryDto>();

        // 1. Add legacy SubCategories
        if (parent.SubCategories != null)
        {
            result.AddRange(parent.SubCategories
                .Where(sc => sc.IsActive)
                .OrderBy(sc => sc.DisplayOrder)
                .Select(sc => new MegaMenuSubCategoryDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    Slug = sc.Slug,
                    Collections = sc.Collections
                        .Where(col => col.IsActive)
                        .OrderBy(col => col.DisplayOrder)
                        .Select(col => new MegaMenuCollectionDto
                        {
                            Id = col.Id,
                            Name = col.Name,
                            Slug = col.Slug
                        })
                }));
        }

        // 2. Add new Recursive Child Categories
        // Treat them as "SubCategories" for the MegaMenu display
        if (parent.ChildCategories != null)
        {
            result.AddRange(parent.ChildCategories
                .Where(sc => sc.IsActive)
                .OrderBy(sc => sc.DisplayOrder)
                .Select(sc => new MegaMenuSubCategoryDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    Slug = sc.Slug,
                    // New child categories might have their own collections directly (if we added that relation)
                    // or currently they might just be categories. 
                    // If we added Collections to Category, we map them here.
                    Collections = sc.Collections
                        .Where(col => col.IsActive)
                        .OrderBy(col => col.DisplayOrder)
                        .Select(col => new MegaMenuCollectionDto
                        {
                            Id = col.Id,
                            Name = col.Name,
                            Slug = col.Slug
                        })
                }));
        }

        return result.OrderBy(x => x.Name); // Optional: sort merged list by name or some other logic
    }
}

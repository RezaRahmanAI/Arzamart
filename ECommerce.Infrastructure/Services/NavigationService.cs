using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Constants;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.Infrastructure.Services;

public class NavigationService : INavigationService
{
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cache;
    private const string MegaMenuCacheKey = "nav:mega-menu";

    public NavigationService(ApplicationDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<MegaMenuDto> GetMegaMenuAsync()
    {
        return await _cache.GetOrCreateAsync(MegaMenuCacheKey, async () =>
        {
            // 1. Get Static Parent Categories
            var categories = CategoryConstants.AllCategories;

            // 2. Get All Active SubCategories with their Collections from DB
            var dbSubCategories = await _context.SubCategories
                .AsNoTracking()
                .Include(sc => sc.Collections)
                .Where(sc => sc.IsActive)
                .OrderBy(sc => sc.DisplayOrder)
                .ToListAsync();

            var menuDto = new MegaMenuDto
            {
                Categories = categories.Select(c => new MegaMenuCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Icon = c.ImageUrl, // Using ImageUrl as icon for now
                    SubCategories = dbSubCategories
                        .Where(sc => sc.CategoryId == c.Id)
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
                        })
                })
            };

            return menuDto;
        }) ?? new MegaMenuDto();
    }
}

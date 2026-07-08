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

public class AdminNavigationService : IAdminNavigationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppCache _cache;
    private readonly IServiceScopeFactory _scopeFactory;

    public AdminNavigationService(IUnitOfWork unitOfWork, AppCache cache, IServiceScopeFactory scopeFactory)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
        _scopeFactory = scopeFactory;
    }

    public async Task<List<NavigationMenuDto>> GetAllAsync()
    {
        var menus = await _unitOfWork.Repository<NavigationMenu>()
            .GetQueryable()
            .Include(m => m.ChildMenus)
            .Where(m => m.ParentMenuId == null)
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync();

        return menus.Select(MapToDto).ToList();
    }

    public async Task<NavigationMenuDto?> GetByIdAsync(int id)
    {
        var menu = await _unitOfWork.Repository<NavigationMenu>()
            .GetQueryable()
            .Include(m => m.ChildMenus)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (menu == null) return null;

        return MapToDto(menu);
    }

    public async Task<NavigationMenuDto> CreateAsync(NavigationMenuCreateDto dto)
    {
        var entity = new NavigationMenu
        {
            Title = dto.Name,
            Url = dto.Link,
            ParentMenuId = dto.ParentMenuId,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive
        };

        _unitOfWork.Repository<NavigationMenu>().Add(entity);
        await _unitOfWork.Complete();

        entity.ChildMenus = new List<NavigationMenu>();

        RebuildNavigationCache();

        return MapToDto(entity);
    }

    public async Task<NavigationMenuDto> UpdateAsync(int id, NavigationMenuCreateDto dto)
    {
        var entity = await _unitOfWork.Repository<NavigationMenu>()
            .GetQueryable()
            .Include(m => m.ChildMenus)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (entity == null)
            throw new InvalidOperationException($"NavigationMenu with ID {id} not found");

        entity.Title = dto.Name;
        entity.Url = dto.Link;
        entity.ParentMenuId = dto.ParentMenuId;
        entity.DisplayOrder = dto.DisplayOrder;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();

        RebuildNavigationCache();

        return MapToDto(entity);
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _unitOfWork.Repository<NavigationMenu>()
            .GetQueryable()
            .FirstOrDefaultAsync(m => m.Id == id);

        if (entity == null)
            throw new InvalidOperationException($"NavigationMenu with ID {id} not found");

        _unitOfWork.Repository<NavigationMenu>().Delete(entity);
        await _unitOfWork.Complete();

        RebuildNavigationCache();
    }

    private void RebuildNavigationCache()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var items = db.NavigationMenus
            .AsNoTracking()
            .Include(n => n.ChildMenus)
                .ThenInclude(c => c.ChildMenus)
            .OrderBy(n => n.DisplayOrder)
            .ToList();

        var megaMenuItems = items
            .Where(n => n.ParentMenuId == null)
            .Select(n => new MegaMenuCategoryDto
            {
                Id = n.Id,
                Name = n.Title ?? "",
                Slug = n.Url ?? "",
                Icon = n.Icon,
                SubCategories = n.ChildMenus?
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.DisplayOrder)
                    .Select(c => new MegaMenuSubCategoryDto
                    {
                        Id = c.Id,
                        Name = c.Title ?? "",
                        Slug = c.Url ?? "",
                        Collections = c.ChildMenus?
                            .Where(col => col.IsActive)
                            .OrderBy(col => col.DisplayOrder)
                            .Select(col => new MegaMenuCollectionDto
                            {
                                Id = col.Id,
                                Name = col.Title ?? "",
                                Slug = col.Url ?? ""
                            }).ToList() ?? new List<MegaMenuCollectionDto>()
                    }).ToList() ?? new List<MegaMenuSubCategoryDto>()
            }).ToList();

        lock (_cache.RebuildLock)
        {
            _cache.NavigationMenus["main"] = megaMenuItems;
        }
        _cache.IncrementVersion("navigation");
    }

    private NavigationMenuDto MapToDto(NavigationMenu menu)
    {
        return new NavigationMenuDto
        {
            Id = menu.Id,
            Name = menu.Title ?? "",
            Link = menu.Url ?? "",
            ParentMenuId = menu.ParentMenuId,
            DisplayOrder = menu.DisplayOrder,
            IsActive = menu.IsActive,
            ChildMenus = menu.ChildMenus?
                .OrderBy(c => c.DisplayOrder)
                .Select(MapToDto)
                .ToList() ?? new List<NavigationMenuDto>()
        };
    }
}

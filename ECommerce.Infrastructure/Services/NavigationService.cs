using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Constants;
using ECommerce.Infrastructure.Cache;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class NavigationService : INavigationService
{
    private readonly AppCache _cache;

    public NavigationService(AppCache cache)
    {
        _cache = cache;
    }

    public Task<MegaMenuDto> GetMegaMenuAsync()
    {
        _cache.NavigationMenus.TryGetValue("main", out var categories);

        var menuDto = new MegaMenuDto
        {
            Categories = categories ?? new List<MegaMenuCategoryDto>()
        };

        return Task.FromResult(menuDto);
    }
}

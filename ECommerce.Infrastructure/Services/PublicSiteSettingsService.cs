using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Cache;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class PublicSiteSettingsService : IPublicSiteSettingsService
{
    private readonly AppCache _cache;

    public PublicSiteSettingsService(AppCache cache)
    {
        _cache = cache;
    }

    public Task<SiteSettingsDto> GetSettingsAsync()
    {
        _cache.SiteSettings.TryGetValue("settings", out var settings);
        return Task.FromResult(settings ?? new SiteSettingsDto());
    }

    public Task<List<DeliveryMethod>> GetActiveDeliveryMethodsAsync()
    {
        _cache.SiteSettings.TryGetValue("settings", out var settings);
        var methods = settings?.DeliveryMethods?
            .Where(dm => dm.IsActive)
            .Select(dm => new DeliveryMethod
            {
                Id = dm.Id,
                Name = dm.Name,
                Cost = dm.Cost,
                EstimatedDays = dm.EstimatedDays,
                IsActive = dm.IsActive
            })
            .ToList() ?? new List<DeliveryMethod>();

        return Task.FromResult(methods);
    }
}

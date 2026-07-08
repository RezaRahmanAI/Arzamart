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

public class AdminSettingsService : IAdminSettingsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppCache _cache;
    private readonly IServiceScopeFactory _scopeFactory;

    public AdminSettingsService(IUnitOfWork unitOfWork, AppCache cache, IServiceScopeFactory scopeFactory)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
        _scopeFactory = scopeFactory;
    }

    public async Task<SiteSettingsDto> GetSettingsAsync()
    {
        var settings = await _unitOfWork.Repository<SiteSetting>()
            .GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync();

        var deliveryMethods = await _unitOfWork.Repository<DeliveryMethod>()
            .GetQueryable()
            .AsNoTracking()
            .ToListAsync();

        var deliveryMethodDtos = deliveryMethods.Select(dm => new DeliveryMethodDto
        {
            Id = dm.Id,
            Name = dm.Name,
            Cost = dm.Cost,
            EstimatedDays = dm.EstimatedDays,
            IsActive = dm.IsActive
        }).ToList();

        return new SiteSettingsDto
        {
            WebsiteName = settings?.WebsiteName,
            LogoUrl = settings?.LogoUrl,
            ContactEmail = settings?.ContactEmail,
            ContactPhone = settings?.ContactPhone,
            Address = settings?.Address,
            FacebookUrl = settings?.FacebookUrl,
            InstagramUrl = settings?.InstagramUrl,
            TwitterUrl = settings?.TwitterUrl,
            YoutubeUrl = settings?.YoutubeUrl,
            WhatsAppNumber = settings?.WhatsAppNumber,
            Currency = settings?.Currency,
            FreeShippingThreshold = settings?.FreeShippingThreshold ?? 0,
            ShippingCharge = settings?.ShippingCharge ?? 0,
            FacebookPixelId = settings?.FacebookPixelId,
            GoogleTagId = settings?.GoogleTagId,
            SizeGuideImageUrl = settings?.SizeGuideImageUrl,
            DeliveryMethods = deliveryMethodDtos
        };
    }

    public async Task<SiteSettingsDto> UpdateSettingsAsync(SiteSettingsDto dto)
    {
        var settings = await _unitOfWork.Repository<SiteSetting>()
            .GetQueryable()
            .FirstOrDefaultAsync();

        if (settings == null)
        {
            settings = new SiteSetting();
            _unitOfWork.Repository<SiteSetting>().Add(settings);
        }

        settings.WebsiteName = dto.WebsiteName;
        settings.LogoUrl = dto.LogoUrl;
        settings.ContactEmail = dto.ContactEmail;
        settings.ContactPhone = dto.ContactPhone;
        settings.Address = dto.Address;
        settings.FacebookUrl = dto.FacebookUrl;
        settings.InstagramUrl = dto.InstagramUrl;
        settings.TwitterUrl = dto.TwitterUrl;
        settings.YoutubeUrl = dto.YoutubeUrl;
        settings.WhatsAppNumber = dto.WhatsAppNumber;
        settings.Currency = dto.Currency;
        settings.FreeShippingThreshold = dto.FreeShippingThreshold;
        settings.ShippingCharge = dto.ShippingCharge;
        settings.FacebookPixelId = dto.FacebookPixelId;
        settings.GoogleTagId = dto.GoogleTagId;
        settings.SizeGuideImageUrl = dto.SizeGuideImageUrl;
        settings.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();

        RebuildSettingsCache();

        return dto;
    }

    public async Task<List<DeliveryMethod>> GetDeliveryMethodsAsync()
    {
        return await _unitOfWork.Repository<DeliveryMethod>()
            .GetQueryable()
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<DeliveryMethod> CreateDeliveryMethodAsync(DeliveryMethodDto dto)
    {
        var method = new DeliveryMethod
        {
            Name = dto.Name,
            Cost = dto.Cost,
            EstimatedDays = dto.EstimatedDays,
            IsActive = dto.IsActive
        };

        _unitOfWork.Repository<DeliveryMethod>().Add(method);
        await _unitOfWork.Complete();

        RebuildSettingsCache();

        return method;
    }

    public async Task UpdateDeliveryMethodAsync(int id, DeliveryMethodDto dto)
    {
        var method = await _unitOfWork.Repository<DeliveryMethod>()
            .GetQueryable()
            .FirstOrDefaultAsync(m => m.Id == id);

        if (method == null)
            throw new InvalidOperationException($"Delivery method with ID {id} not found");

        method.Name = dto.Name;
        method.Cost = dto.Cost;
        method.EstimatedDays = dto.EstimatedDays;
        method.IsActive = dto.IsActive;
        method.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();

        RebuildSettingsCache();
    }

    public async Task DeleteDeliveryMethodAsync(int id)
    {
        var method = await _unitOfWork.Repository<DeliveryMethod>()
            .GetQueryable()
            .FirstOrDefaultAsync(m => m.Id == id);

        if (method == null)
            throw new InvalidOperationException($"Delivery method with ID {id} not found");

        _unitOfWork.Repository<DeliveryMethod>().Delete(method);
        await _unitOfWork.Complete();

        RebuildSettingsCache();
    }

    private void RebuildSettingsCache()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var settings = db.SiteSettings
            .AsNoTracking()
            .FirstOrDefault();

        var deliveryMethods = db.DeliveryMethods
            .AsNoTracking()
            .ToList();

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
            lock (_cache.RebuildLock)
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
                _cache.IncrementVersion("settings");
            }
        }
    }
}

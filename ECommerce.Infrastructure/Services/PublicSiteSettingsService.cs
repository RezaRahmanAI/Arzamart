using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class PublicSiteSettingsService : IPublicSiteSettingsService
{
    private readonly IUnitOfWork _unitOfWork;

    public PublicSiteSettingsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<SiteSettingsDto> GetSettingsAsync()
    {
        var setting = await _unitOfWork.Repository<SiteSetting>().GetQueryable()
            .FirstOrDefaultAsync();

        if (setting == null)
            return new SiteSettingsDto();

        return new SiteSettingsDto
        {
            WebsiteName = setting.WebsiteName,
            LogoUrl = setting.LogoUrl,
            ContactEmail = setting.ContactEmail,
            ContactPhone = setting.ContactPhone,
            Address = setting.Address,
            FacebookUrl = setting.FacebookUrl,
            InstagramUrl = setting.InstagramUrl,
            TwitterUrl = setting.TwitterUrl,
            YoutubeUrl = setting.YoutubeUrl,
            WhatsAppNumber = setting.WhatsAppNumber,
            Currency = setting.Currency,
            FreeShippingThreshold = setting.FreeShippingThreshold,
            ShippingCharge = setting.ShippingCharge,
            FacebookPixelId = setting.FacebookPixelId,
            GoogleTagId = setting.GoogleTagId,
            SizeGuideImageUrl = setting.SizeGuideImageUrl
        };
    }

    public async Task<List<DeliveryMethod>> GetActiveDeliveryMethodsAsync()
    {
        return await _unitOfWork.Repository<DeliveryMethod>().GetQueryable()
            .Where(dm => dm.IsActive)
            .ToListAsync();
    }
}

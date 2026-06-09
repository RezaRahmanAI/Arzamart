using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces;

public interface IPublicSiteSettingsService
{
    Task<SiteSettingsDto> GetSettingsAsync();
    Task<List<DeliveryMethod>> GetActiveDeliveryMethodsAsync();
}

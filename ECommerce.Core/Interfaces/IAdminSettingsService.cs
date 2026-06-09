using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces;

public interface IAdminSettingsService
{
    Task<SiteSettingsDto> GetSettingsAsync();
    Task<SiteSettingsDto> UpdateSettingsAsync(SiteSettingsDto dto);
    Task<List<DeliveryMethod>> GetDeliveryMethodsAsync();
    Task<DeliveryMethod> CreateDeliveryMethodAsync(DeliveryMethodDto dto);
    Task UpdateDeliveryMethodAsync(int id, DeliveryMethodDto dto);
    Task DeleteDeliveryMethodAsync(int id);
}

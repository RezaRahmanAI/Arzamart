using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IAdminCustomLandingPageService
{
    Task<CustomLandingPageConfigDto?> GetConfigAsync(int productId);
    Task<CustomLandingPageConfigDto> SaveConfigAsync(CustomLandingPageConfigUpdateDto dto);
}

using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface ICustomLandingPageService
{
    Task<CustomLandingPageDataDto?> GetDataAsync(string slug);
}

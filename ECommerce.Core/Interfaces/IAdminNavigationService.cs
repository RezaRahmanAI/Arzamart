using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IAdminNavigationService
{
    Task<List<NavigationMenuDto>> GetAllAsync();
    Task<NavigationMenuDto?> GetByIdAsync(int id);
    Task<NavigationMenuDto> CreateAsync(NavigationMenuCreateDto dto);
    Task<NavigationMenuDto> UpdateAsync(int id, NavigationMenuCreateDto dto);
    Task DeleteAsync(int id);
}

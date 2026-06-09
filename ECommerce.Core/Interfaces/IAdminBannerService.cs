using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IAdminBannerService
{
    Task<List<HeroBannerDto>> GetAllAsync();
    Task<HeroBannerDto?> GetByIdAsync(int id);
    Task<HeroBannerDto> CreateAsync(CreateHeroBannerDto dto);
    Task<HeroBannerDto> UpdateAsync(int id, CreateHeroBannerDto dto);
    Task DeleteAsync(int id);
}

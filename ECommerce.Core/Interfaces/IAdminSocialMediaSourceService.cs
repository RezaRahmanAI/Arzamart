using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IAdminSocialMediaSourceService
{
    Task<List<SocialMediaSourceDto>> GetAllAsync();
    Task<List<SocialMediaSourceDto>> GetActiveAsync();
    Task<SocialMediaSourceDto?> GetByIdAsync(int id);
    Task<SocialMediaSourceDto> CreateAsync(SocialMediaSourceCreateDto dto);
    Task<SocialMediaSourceDto> UpdateAsync(int id, SocialMediaSourceCreateDto dto);
    Task DeleteAsync(int id);
}

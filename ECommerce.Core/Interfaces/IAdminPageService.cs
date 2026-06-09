using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IAdminPageService
{
    Task<List<PageDto>> GetAllAsync();
    Task<PageDto?> GetByIdAsync(int id);
    Task<PageDto> CreateAsync(PageCreateDto dto);
    Task<PageDto> UpdateAsync(int id, PageCreateDto dto);
    Task DeleteAsync(int id);
}

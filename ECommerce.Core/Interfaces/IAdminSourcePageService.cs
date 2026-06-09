using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IAdminSourcePageService
{
    Task<List<SourcePageDto>> GetAllAsync();
    Task<List<SourcePageDto>> GetActiveAsync();
    Task<SourcePageDto?> GetByIdAsync(int id);
    Task<SourcePageDto> CreateAsync(SourcePageCreateDto dto);
    Task<SourcePageDto> UpdateAsync(int id, SourcePageCreateDto dto);
    Task DeleteAsync(int id);
}

using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface ICategoryAdminService
{
    Task<List<CategoryDto>> GetAllAsync();
    Task<CategoryDto?> GetByIdAsync(int id);
    Task<CategoryDto> CreateAsync(CategoryCreateDto dto);
    Task UpdateAsync(int id, CategoryUpdateDto dto);
    Task DeleteAsync(int id);
    Task ReorderAsync(List<int> sortedIds);
}

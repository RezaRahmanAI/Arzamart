using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface ISubCategoryAdminService
{
    Task<List<SubCategoryDto>> GetAllAsync();
    Task<SubCategoryDto?> GetByIdAsync(int id);
    Task<SubCategoryDto> CreateAsync(SubCategoryCreateDto dto);
    Task<SubCategoryDto> UpdateAsync(int id, SubCategoryUpdateDto dto);
    Task DeleteAsync(int id);
}

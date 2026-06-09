using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IPublicCategoryService
{
    Task<List<CategoryDto>> GetAllActiveAsync();
}

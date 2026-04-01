using System.Collections.Generic;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IAdultProductService
{
    Task<IEnumerable<AdultProductDto>> GetAllAsync();
    Task<AdultProductDto?> GetByIdAsync(int id);
    Task<AdultProductDto?> GetBySlugAsync(string slug);
    Task<AdultProductDto> CreateAsync(AdultProductCreateUpdateDto dto);
    Task<bool> UpdateAsync(int id, AdultProductCreateUpdateDto dto);
    Task<bool> DeleteAsync(int id);
}

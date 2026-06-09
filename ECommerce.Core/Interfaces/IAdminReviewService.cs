using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IAdminReviewService
{
    Task<List<ReviewDto>> GetAllAsync();
    Task DeleteAsync(int id);
    Task<ReviewDto> UpdateAsync(int id, ReviewUpdateDto dto);
}

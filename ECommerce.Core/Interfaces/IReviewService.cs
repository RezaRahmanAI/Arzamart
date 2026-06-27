using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces;

public interface IReviewService
{
    Task<IEnumerable<Review>> GetReviewsByProductIdAsync(int productId);
    Task<IEnumerable<Review>> GetFeaturedReviewsAsync();
    Task<Review> AddReviewAsync(Review review);
}

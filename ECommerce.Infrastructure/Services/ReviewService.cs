using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;

namespace ECommerce.Infrastructure.Services;

public class ReviewService : IReviewService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReviewService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<Review>> GetReviewsByProductIdAsync(int productId)
    {
        var spec = new ReviewSpecification(productId);
        return await _unitOfWork.Repository<Review>().ListAsync(spec);
    }

    public async Task<IEnumerable<Review>> GetFeaturedReviewsAsync()
    {
        var spec = new ReviewSpecification(isFeatured: true);
        return await _unitOfWork.Repository<Review>().ListAsync(spec);
    }

    public async Task<Review> AddReviewAsync(Review review)
    {
        // Auto-approve for now
        review.IsApproved = true; 
        review.Date = DateTime.UtcNow;
        
        _unitOfWork.Repository<Review>().Add(review);
        await _unitOfWork.Complete();
        
        return review;
    }

    public async Task<Review?> GetReviewByIdAsync(int id)
    {
        return await _unitOfWork.Repository<Review>().GetByIdAsync(id);
    }

    public async Task UpdateReviewAsync(Review review)
    {
        _unitOfWork.Repository<Review>().Update(review);
        await _unitOfWork.Complete();
    }

    public async Task DeleteReviewAsync(int id)
    {
        var review = await _unitOfWork.Repository<Review>().GetByIdAsync(id);
        if (review != null)
        {
            _unitOfWork.Repository<Review>().Delete(review);
            await _unitOfWork.Complete();
        }
    }
}

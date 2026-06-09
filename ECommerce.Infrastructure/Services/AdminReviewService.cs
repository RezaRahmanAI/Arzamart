using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class AdminReviewService : IAdminReviewService
{
    private readonly IUnitOfWork _unitOfWork;

    public AdminReviewService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<ReviewDto>> GetAllAsync()
    {
        var reviews = await _unitOfWork.Repository<Review>().GetQueryable()
            .Include(r => r.Product)
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        return reviews.Select(r => new ReviewDto
        {
            Id = r.Id,
            ProductId = r.ProductId,
            ProductName = r.Product?.Name ?? string.Empty,
            CustomerName = r.CustomerName,
            CustomerAvatar = r.CustomerAvatar,
            Rating = r.Rating,
            Comment = r.Comment,
            ScreenshotUrl = r.ScreenshotUrl,
            Date = r.Date,
            IsVerifiedPurchase = r.IsVerifiedPurchase,
            IsFeatured = r.IsFeatured,
            Likes = r.Likes
        }).ToList();
    }

    public async Task DeleteAsync(int id)
    {
        var review = await _unitOfWork.Repository<Review>().GetQueryable()
            .FirstOrDefaultAsync(r => r.Id == id);

        if (review == null)
            throw new InvalidOperationException($"Review with id {id} not found.");

        _unitOfWork.Repository<Review>().Delete(review);
        await _unitOfWork.Complete();
    }

    public async Task<ReviewDto> UpdateAsync(int id, ReviewUpdateDto dto)
    {
        var review = await _unitOfWork.Repository<Review>().GetQueryable()
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (review == null)
            throw new InvalidOperationException($"Review with id {id} not found.");

        review.Rating = dto.Rating;
        review.Comment = dto.Comment;
        if (!string.IsNullOrEmpty(dto.CustomerName))
            review.CustomerName = dto.CustomerName;
        review.CustomerAvatar = dto.CustomerAvatar;
        review.ScreenshotUrl = dto.ScreenshotUrl;
        review.IsVerifiedPurchase = dto.IsVerifiedPurchase;

        await _unitOfWork.Complete();

        return new ReviewDto
        {
            Id = review.Id,
            ProductId = review.ProductId,
            ProductName = review.Product?.Name ?? string.Empty,
            CustomerName = review.CustomerName,
            CustomerAvatar = review.CustomerAvatar,
            Rating = review.Rating,
            Comment = review.Comment,
            ScreenshotUrl = review.ScreenshotUrl,
            Date = review.Date,
            IsVerifiedPurchase = review.IsVerifiedPurchase,
            IsFeatured = review.IsFeatured,
            Likes = review.Likes
        };
    }
}

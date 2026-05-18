using ECommerce.Core.DTOs;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/reviews")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("reviews")]
public class AdminReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminReviewsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ReviewDto>>> GetAllReviews()
    {
        var reviews = await _context.Reviews
            .Include(r => r.Product)
            .OrderByDescending(r => r.Date)
            .Select(r => new ReviewDto
            {
                Id = r.Id,
                CustomerName = r.CustomerName,
                CustomerAvatar = r.CustomerAvatar,
                Rating = r.Rating,
                Comment = r.Comment,
                ScreenshotUrl = r.ScreenshotUrl,
                IsVerifiedPurchase = r.IsVerifiedPurchase,
                Date = r.Date,
                ProductId = r.ProductId,
                IsFeatured = r.IsFeatured,
                Likes = r.Likes
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpPost("{id}/delete")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> DeleteReview(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null) return NotFound();

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<ReviewDto>> UpdateReview(int id, [FromBody] ReviewUpdateDto dto)
    {
        var review = await _context.Reviews
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == id);
            
        if (review == null) return NotFound();

        review.Rating = dto.Rating;
        review.Comment = dto.Comment;
        if (!string.IsNullOrEmpty(dto.CustomerName)) review.CustomerName = dto.CustomerName;
        review.CustomerAvatar = dto.CustomerAvatar;
        review.ScreenshotUrl = dto.ScreenshotUrl;
        review.IsVerifiedPurchase = dto.IsVerifiedPurchase;

        await _context.SaveChangesAsync();

        return Ok(new ReviewDto
        {
            Id = review.Id,
            CustomerName = review.CustomerName,
            CustomerAvatar = review.CustomerAvatar,
            Rating = review.Rating,
            Comment = review.Comment,
            ScreenshotUrl = review.ScreenshotUrl,
            IsVerifiedPurchase = review.IsVerifiedPurchase,
            Date = review.Date,
            ProductId = review.ProductId,
            IsFeatured = review.IsFeatured,
            Likes = review.Likes
        });
    }
}


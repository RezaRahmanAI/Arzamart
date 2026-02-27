using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

public class ReviewsController : BaseApiController
{
    private readonly IReviewService _reviewService;
    private readonly IMapper _mapper;

    public ReviewsController(IReviewService reviewService, IMapper mapper)
    {
        _reviewService = reviewService;
        _mapper = mapper;
    }

    [HttpGet("products/{productId}")]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetReviews(int productId)
    {
        var reviews = await _reviewService.GetReviewsByProductIdAsync(productId);
        return Ok(_mapper.Map<IEnumerable<ReviewDto>>(reviews));
    }

    [HttpGet("featured")]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetFeaturedReviews()
    {
        try 
        {
            var reviews = await _reviewService.GetFeaturedReviewsAsync();
            return Ok(_mapper.Map<IEnumerable<ReviewDto>>(reviews));
        }
        catch (Exception ex)
        {
            return BadRequest($"Error fetching featured reviews: {ex.Message} {ex.InnerException?.Message}");
        }
    }

    [HttpPost("products/{productId}")]
    // [Authorize] // Uncomment when auth is fully ready on frontend
    public async Task<ActionResult<ReviewDto>> AddReview(int productId, CreateReviewDto createReviewDto)
    {
        if (productId != createReviewDto.ProductId)
        {
            return BadRequest("Product ID mismatch");
        }

        var review = _mapper.Map<Review>(createReviewDto);
        review.ProductId = productId;
        
        var addedReview = await _reviewService.AddReviewAsync(review);
        return Ok(_mapper.Map<ReviewDto>(addedReview));
    }
}

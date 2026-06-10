using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.API.Controllers;

public class ReviewsController : BaseApiController
{
    private readonly IReviewService _reviewService;
    private readonly IMapper _mapper;
    private readonly IMemoryCache _cache;

    public ReviewsController(IReviewService reviewService, IMapper mapper, IMemoryCache cache)
    {
        _reviewService = reviewService;
        _mapper = mapper;
        _cache = cache;
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
            const string cacheKey = "reviews_featured";
            if (_cache.TryGetValue(cacheKey, out IEnumerable<ReviewDto> cached))
                return Ok(cached);

            var reviews = await _reviewService.GetFeaturedReviewsAsync();
            var result = _mapper.Map<IEnumerable<ReviewDto>>(reviews);
            _cache.Set(cacheKey, result, TimeSpan.FromSeconds(60));
            return Ok(result);
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

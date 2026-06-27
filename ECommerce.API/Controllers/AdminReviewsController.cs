using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/reviews")]
[Authorize(Roles = "Admin,SuperAdmin,Staff")]
[ECommerce.API.Helpers.StaffMenuAccess("reviews")]
public class AdminReviewsController : ControllerBase
{
    private readonly IAdminReviewService _reviewService;

    public AdminReviewsController(IAdminReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ReviewDto>>> GetAllReviews()
    {
        var reviews = await _reviewService.GetAllAsync();
        return Ok(reviews);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult> DeleteReview(int id)
    {
        try
        {
            await _reviewService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ReviewDto>> UpdateReview(int id, [FromBody] ReviewUpdateDto dto)
    {
        try
        {
            var result = await _reviewService.UpdateAsync(id, dto);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }
}

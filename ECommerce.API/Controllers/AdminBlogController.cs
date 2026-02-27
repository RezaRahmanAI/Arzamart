using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/blog")]
[Authorize(Roles = "Admin")]
public class AdminBlogController : ControllerBase
{
    private readonly IBlogService _blogService;

    public AdminBlogController(IBlogService blogService)
    {
        _blogService = blogService;
    }

    [HttpGet("posts")]
    public async Task<ActionResult<List<BlogPostDto>>> GetAllPosts()
    {
        var posts = await _blogService.GetAllPostsAsync();
        return Ok(posts);
    }

    [HttpGet("posts/{id}")]
    public async Task<ActionResult<BlogPostDto>> GetPostById(int id)
    {
        var post = await _blogService.GetPostByIdAsync(id);
        if (post == null)
            return NotFound();

        return Ok(post);
    }

    [HttpPost("posts")]
    public async Task<ActionResult<BlogPostDto>> CreatePost([FromBody] CreateBlogPostDto dto)
    {
        var post = await _blogService.CreatePostAsync(dto);
        return CreatedAtAction(nameof(GetPostById), new { id = post.Id }, post);
    }

    [HttpPost("posts/{id}")]
    public async Task<ActionResult<BlogPostDto>> UpdatePost(int id, [FromBody] UpdateBlogPostDto dto)
    {
        var post = await _blogService.UpdatePostAsync(id, dto);
        if (post == null)
            return NotFound();

        return Ok(post);
    }

    [HttpPost("posts/{id}/delete")]
    public async Task<ActionResult> DeletePost(int id)
    {
        var result = await _blogService.DeletePostAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }
}

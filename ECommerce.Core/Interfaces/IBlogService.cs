using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IBlogService
{
    Task<List<BlogPostDto>> GetAllPostsAsync();
    Task<BlogPostDto?> GetPostByIdAsync(int id);
    Task<BlogPostDto?> GetPostBySlugAsync(string slug);
    Task<BlogPostDto> CreatePostAsync(CreateBlogPostDto dto);
    Task<BlogPostDto?> UpdatePostAsync(int id, UpdateBlogPostDto dto);
    Task<bool> DeletePostAsync(int id);
}

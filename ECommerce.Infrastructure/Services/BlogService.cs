using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class BlogService : IBlogService
{
    private readonly ApplicationDbContext _context;

    public BlogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<BlogPostDto>> GetAllPostsAsync()
    {
        return await _context.BlogPosts
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => MapToDto(p))
            .ToListAsync();
    }

    public async Task<BlogPostDto?> GetPostByIdAsync(int id)
    {
        var post = await _context.BlogPosts.FindAsync(id);
        return post == null ? null : MapToDto(post);
    }

    public async Task<BlogPostDto?> GetPostBySlugAsync(string slug)
    {
        var post = await _context.BlogPosts.FirstOrDefaultAsync(p => p.Slug == slug);
        return post == null ? null : MapToDto(post);
    }

    public async Task<BlogPostDto> CreatePostAsync(CreateBlogPostDto dto)
    {
        var post = new BlogPost
        {
            Title = dto.Title,
            Slug = GenerateSlug(dto.Title),
            Content = dto.Content,
            Excerpt = dto.Excerpt,
            FeaturedImage = dto.FeaturedImage,
            Status = Enum.Parse<BlogPostStatus>(dto.Status, true),
            Author = dto.Author,
            Tags = dto.Tags,
            PublishedAt = dto.Status.ToLower() == "published" ? DateTime.UtcNow : null
        };

        _context.BlogPosts.Add(post);
        await _context.SaveChangesAsync();

        return MapToDto(post);
    }

    public async Task<BlogPostDto?> UpdatePostAsync(int id, UpdateBlogPostDto dto)
    {
        var post = await _context.BlogPosts.FindAsync(id);
        if (post == null) return null;

        post.Title = dto.Title;
        post.Slug = GenerateSlug(dto.Title);
        post.Content = dto.Content;
        post.Excerpt = dto.Excerpt;
        post.FeaturedImage = dto.FeaturedImage;
        post.Status = Enum.Parse<BlogPostStatus>(dto.Status, true);
        post.Author = dto.Author;
        post.Tags = dto.Tags;
        post.UpdatedAt = DateTime.UtcNow;

        if (dto.Status.ToLower() == "published" && post.PublishedAt == null)
        {
            post.PublishedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return MapToDto(post);
    }

    public async Task<bool> DeletePostAsync(int id)
    {
        var post = await _context.BlogPosts.FindAsync(id);
        if (post == null) return false;

        _context.BlogPosts.Remove(post);
        await _context.SaveChangesAsync();

        return true;
    }

    private static BlogPostDto MapToDto(BlogPost post)
    {
        return new BlogPostDto
        {
            Id = post.Id,
            Title = post.Title,
            Slug = post.Slug,
            Content = post.Content,
            Excerpt = post.Excerpt,
            FeaturedImage = post.FeaturedImage,
            Status = post.Status.ToString(),
            PublishedAt = post.PublishedAt,
            Author = post.Author,
            Tags = post.Tags,
            ViewCount = post.ViewCount,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt
        };
    }

    private static string GenerateSlug(string title)
    {
        return title.ToLower()
            .Replace(" ", "-")
            .Replace("?", "")
            .Replace("!", "")
            .Replace(".", "")
            .Replace(",", "");
    }
}

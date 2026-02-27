namespace ECommerce.Core.DTOs;

public class BlogPostDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? FeaturedImage { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? PublishedAt { get; set; }
    public string Author { get; set; } = string.Empty;
    public string? Tags { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateBlogPostDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? FeaturedImage { get; set; }
    public string Status { get; set; } = "Draft";
    public string Author { get; set; } = string.Empty;
    public string? Tags { get; set; }
}

public class UpdateBlogPostDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? FeaturedImage { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? Tags { get; set; }
}

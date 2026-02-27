namespace ECommerce.Core.Entities;

public enum BlogPostStatus
{
    Draft,
    Published,
    Archived
}

public class BlogPost : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? FeaturedImage { get; set; }
    public BlogPostStatus Status { get; set; } = BlogPostStatus.Draft;
    public DateTime? PublishedAt { get; set; }
    public string Author { get; set; } = string.Empty;
    public string? Tags { get; set; } // Comma-separated tags
    public int ViewCount { get; set; } = 0;
}

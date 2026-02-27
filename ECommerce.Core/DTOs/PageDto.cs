namespace ECommerce.Core.DTOs;

public class PageDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Slug { get; set; }
    public string Content { get; set; }
    public string MetaTitle { get; set; }
    public string MetaDescription { get; set; }
    public bool IsActive { get; set; }
}

public class PageCreateDto
{
    public string Title { get; set; }
    public string Slug { get; set; }
    public string Content { get; set; }
    public string MetaTitle { get; set; }
    public string MetaDescription { get; set; }
    public bool IsActive { get; set; } = true;
}


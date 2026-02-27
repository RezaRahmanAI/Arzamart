namespace ECommerce.Core.Entities;

public class Page : BaseEntity
{
    public string Title { get; set; }
    public string Slug { get; set; }
    public string? Content { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public bool IsActive { get; set; } = true;
}

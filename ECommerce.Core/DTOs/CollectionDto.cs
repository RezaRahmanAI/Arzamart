namespace ECommerce.Core.DTOs;

public class CollectionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int SubCategoryId { get; set; }
    public bool IsActive { get; set; }
}

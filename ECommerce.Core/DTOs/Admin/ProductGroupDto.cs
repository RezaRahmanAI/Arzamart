using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs.Admin;

public class ProductGroupDto
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<int> ProductIds { get; set; } = new();
}

public class CreateProductGroupDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
}

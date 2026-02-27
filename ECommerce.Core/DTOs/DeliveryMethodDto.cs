using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs;

public class DeliveryMethodDto
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public decimal Cost { get; set; }

    [MaxLength(100)]
    public string? EstimatedDays { get; set; }

    public bool IsActive { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities;

public class DeliveryMethod : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public decimal Cost { get; set; }

    [MaxLength(100)]
    public string? EstimatedDays { get; set; }

    public bool IsActive { get; set; } = true;
}

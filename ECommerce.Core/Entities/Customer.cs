using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities;

public class Customer : BaseEntity
{
    [Required]
    public string Phone { get; set; } = string.Empty;  // Unique identifier

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Address { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? Area { get; set; }

    public bool IsSuspicious { get; set; } = false;
}

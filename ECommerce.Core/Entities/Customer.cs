using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities;

public class Customer : BaseEntity
{
    [Required]
    public string Phone { get; set; }  // Unique identifier

    [Required]
    public string Name { get; set; }

    [Required]
    public string Address { get; set; }

    public bool IsSuspicious { get; set; } = false;
}

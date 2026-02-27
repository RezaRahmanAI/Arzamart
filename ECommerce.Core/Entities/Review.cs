using System;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities;

public class Review : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; }

    [Required]
    public string CustomerName { get; set; }

    public string? CustomerAvatar { get; set; } // Renamed from UserAvatar

    [Range(1, 5)]
    public int Rating { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Comment { get; set; }

    public DateTime Date { get; set; } = DateTime.UtcNow;

    public bool IsVerifiedPurchase { get; set; } = false;

    public bool IsFeatured { get; set; } = false;
    
    public bool IsApproved { get; set; } = false;
    
    public int Likes { get; set; } = 0;
}

using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs;

public class ReviewDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public string CustomerName { get; set; }
    public string? CustomerAvatar { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; }
    public DateTime Date { get; set; }
    public bool IsVerifiedPurchase { get; set; }
    public bool IsFeatured { get; set; }
    public int Likes { get; set; }
}

public class CreateReviewDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    public string CustomerName { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Comment { get; set; }
}

public class ReviewUpdateDto
{
    public int Rating { get; set; }
    public string Comment { get; set; }
}

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs;

public class CartItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSlug { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? SalePrice { get; set; }
    public int Quantity { get; set; }
    public string Size { get; set; } = string.Empty;
    public int AvailableStock { get; set; }
}

public class CartDto
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public string? GuestId { get; set; }
    public string? SessionId { get; set; }
    public List<CartItemDto> Items { get; set; } = new();
    
    public decimal Subtotal { get; set; }
    public int TotalItems { get; set; }
}

public class AddToCartDto
{
    [Required]
    public int ProductId { get; set; }

    [Range(1, 999, ErrorMessage = "Quantity must be between 1 and 999")]
    public int Quantity { get; set; }

    public string Size { get; set; } = string.Empty;
}

public class UpdateCartItemDto
{
    [Range(1, 999, ErrorMessage = "Quantity must be between 1 and 999")]
    public int Quantity { get; set; }
}

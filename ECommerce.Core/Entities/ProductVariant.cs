namespace ECommerce.Core.Entities;

public class ProductVariant : BaseEntity
{
    public string? Sku { get; set; }
    public string? Size { get; set; }
    public decimal? Price { get; set; } // Selling Price (e.g., 800)
    public decimal? CompareAtPrice { get; set; } // Original/Strike-through Price (e.g., 1000)
    public decimal? PurchaseRate { get; set; } // Purchase rate for this size
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; } = true;

    // Foreign Key
    public int ProductId { get; set; }
    public Product Product { get; set; }
}

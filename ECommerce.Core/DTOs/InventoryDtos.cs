namespace ECommerce.Core.DTOs;

public class ProductInventoryDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public string ProductSlug { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int TotalStock { get; set; }
    public int StockQuantity { get; set; }
    public decimal? Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public decimal? PurchaseRate { get; set; }
    public List<VariantInventoryDto> Variants { get; set; } = new();
}

public class VariantInventoryDto
{
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public decimal? Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public decimal? PurchaseRate { get; set; }
}

public class UpdateInventoryDto
{
    public int Quantity { get; set; }
    public decimal? Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public decimal? PurchaseRate { get; set; }
}

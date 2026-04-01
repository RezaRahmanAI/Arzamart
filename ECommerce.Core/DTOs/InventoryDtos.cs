namespace ECommerce.Core.DTOs;

public class ProductInventoryDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int TotalStock { get; set; }
    public List<VariantInventoryDto> Variants { get; set; } = new();
}

public class VariantInventoryDto
{
    public int VariantId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
}

public class UpdateStockDto
{
    public int Quantity { get; set; }
}

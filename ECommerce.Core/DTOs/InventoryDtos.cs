namespace ECommerce.Core.DTOs;

public class ProductInventoryDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public string ProductSku { get; set; }
    public string ImageUrl { get; set; }
    public int TotalStock { get; set; }
    public List<VariantInventoryDto> Variants { get; set; } = new();
}

public class VariantInventoryDto
{
    public int VariantId { get; set; }
    public string Sku { get; set; }
    public string Size { get; set; }
    public int StockQuantity { get; set; }
}

public class UpdateStockDto
{
    public int Quantity { get; set; }
}

namespace ECommerce.Core.DTOs.Products;

public class ProductCatalogItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public string? ImageUrl { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
    public string Status { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public string? Slug { get; set; }
}

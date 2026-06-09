namespace ECommerce.Core.DTOs.Products;

public class ProductSearchResultDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Sku { get; set; }
    public decimal Price { get; set; }
    public List<ProductSearchVariantDto> Variants { get; set; } = new();
}

public class ProductSearchVariantDto
{
    public int Id { get; set; }
    public string? Size { get; set; }
    public int StockQuantity { get; set; }
    public decimal Price { get; set; }
}

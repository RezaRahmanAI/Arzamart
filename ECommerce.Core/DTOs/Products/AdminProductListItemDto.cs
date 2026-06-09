namespace ECommerce.Core.DTOs.Products;

public class AdminProductListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public string? Sku { get; set; }
    public decimal Price { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal? PurchaseRate { get; set; }
    public int StockQuantity { get; set; }
    public bool IsNew { get; set; }
    public bool IsFeatured { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public string SubCategory { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public List<string> MediaUrls { get; set; } = new();
    public List<ECommerce.Core.DTOs.ProductImageDto> Images { get; set; } = new();
    public List<ECommerce.Core.DTOs.ProductVariantDto> Variants { get; set; } = new();
    public string? Tier { get; set; }
    public string? Tags { get; set; }
    public int? SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Slug { get; set; }
}

public class AdminProductListResultDto
{
    public List<AdminProductListItemDto> Items { get; set; } = new();
    public int Total { get; set; }
}

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using ECommerce.Core.Enums;

namespace ECommerce.Core.DTOs;

// Main product creation DTO
public class ProductCreateDto
{
    [Required(ErrorMessage = "Product name is required")]
    [MaxLength(200, ErrorMessage = "Product name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }
    
    [MaxLength(500, ErrorMessage = "Short description cannot exceed 500 characters")]
    public string? ShortDescription { get; set; }
    
    public bool StatusActive { get; set; } = true;
    
    [Required(ErrorMessage = "Category is required")]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Gender is required")]
    [MaxLength(50)]
    public string Gender { get; set; } = "women";
    
    [Required]
    [Range(0.01, 1000000, ErrorMessage = "Price must be between 0.01 and 1,000,000")]
    public decimal Price { get; set; }
    
    [Range(0.01, 1000000, ErrorMessage = "Sale price must be between 0.01 and 1,000,000")]
    public decimal? SalePrice { get; set; }
    
    [Range(0, 1000000, ErrorMessage = "Purchase rate must be between 0 and 1,000,000")]
    public decimal PurchaseRate { get; set; }
    

    public bool NewArrival { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsPopupOffer { get; set; }
    
    [Required]
    public ProductMediaDto Media { get; set; } = new();
    
    [Required]
    public ProductVariantsDto Variants { get; set; } = new();
    
    [Required]
    public List<ProductVariantEditDto> InventoryVariants { get; set; } = new();
    
    public ProductMetaDto Meta { get; set; } = new();
    public ProductRatingsDto Ratings { get; set; } = new();

    // New Fields
    public string? Tier { get; set; }
    public string? Tags { get; set; }
    public int SortOrder { get; set; }
    public int? SubCategoryId { get; set; }
    public int? CollectionId { get; set; }

    public ProductType ProductType { get; set; } = ProductType.Simple;
    public List<ProductBundleItemCreateDto> BundleItems { get; set; } = new();
}

// Product update DTO
public class ProductUpdateDto
{
    [Required(ErrorMessage = "Product name is required")]
    [MaxLength(200, ErrorMessage = "Product name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }
    
    [MaxLength(500, ErrorMessage = "Short description cannot exceed 500 characters")]
    public string? ShortDescription { get; set; }
    
    public bool StatusActive { get; set; } = true;
    
    [Required(ErrorMessage = "Category is required")]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Gender is required")]
    [MaxLength(50)]
    public string Gender { get; set; } = "women";
    
    [Required]
    [Range(0.01, 1000000, ErrorMessage = "Price must be between 0.01 and 1,000,000")]
    public decimal Price { get; set; }
    
    [Range(0.01, 1000000, ErrorMessage = "Sale price must be between 0.01 and 1,000,000")]
    public decimal? SalePrice { get; set; }
    
    [Range(0, 1000000, ErrorMessage = "Purchase rate must be between 0 and 1,000,000")]
    public decimal PurchaseRate { get; set; }
    

    public bool NewArrival { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsPopupOffer { get; set; }
    
    [Required]
    public ProductMediaDto Media { get; set; } = new();
    
    [Required]
    public ProductVariantsDto Variants { get; set; } = new();
    
    [Required]
    public List<ProductVariantEditDto> InventoryVariants { get; set; } = new();
    
    public ProductMetaDto Meta { get; set; } = new();

    // New Fields
    public string? Tier { get; set; }
    public string? Tags { get; set; }
    public int SortOrder { get; set; }
    public int? SubCategoryId { get; set; }
    public int? CollectionId { get; set; }

    public ProductType ProductType { get; set; } = ProductType.Simple;
    public List<ProductBundleItemCreateDto> BundleItems { get; set; } = new();
}

public class ProductVariantEditDto
{
    public string Label { get; set; }
    public decimal Price { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal PurchaseRate { get; set; }
    public string Sku { get; set; }
    public int Inventory { get; set; }
    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }
}

public class ProductBundleItemCreateDto
{
    public int ComponentProductId { get; set; }
    public int? ComponentVariantId { get; set; }
    public int Quantity { get; set; } = 1;
}

// Supporting DTOs
public class ProductMediaDto
{
    public ProductMediaImageDto MainImage { get; set; } = new();
    public List<ProductMediaImageDto> Thumbnails { get; set; } = new();
}

public class ProductMediaImageDto
{
    public string Type { get; set; } = "image";
    public string Label { get; set; } = string.Empty;
    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;
    public string Alt { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class ProductColorDto
{
    public string Name { get; set; } = string.Empty;
    public string Hex { get; set; } = "#111827";
    public bool Selected { get; set; }
}

public class ProductSizeDto
{
    public string Label { get; set; } = string.Empty;
    public int Stock { get; set; }
    public bool Selected { get; set; }
}

public class ProductVariantsDto
{
    public List<ProductColorDto> Colors { get; set; } = new();
    public List<ProductSizeDto> Sizes { get; set; } = new();
}

public class ProductMetaDto
{
    public string FabricAndCare { get; set; } = string.Empty;
    public string ShippingAndReturns { get; set; } = string.Empty;
}

public class ProductRatingsDto
{
    public double Average { get; set; }
    public int Count { get; set; }
}

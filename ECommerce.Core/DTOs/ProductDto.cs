using System.Collections.Generic;
using ECommerce.Core.Enums;

namespace ECommerce.Core.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public string Sku { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public decimal? PurchaseRate { get; set; }
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; }
    public bool IsItemProduct { get; set; }

    public bool IsNew { get; set; }
    public bool IsFeatured { get; set; }
    
    // Category Info
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int? SubCategoryId { get; set; }
    public string? SubCategoryName { get; set; }
    public int? CollectionId { get; set; }
    public string? CollectionName { get; set; }
    
    // Media
    public string? ImageUrl { get; set; }
    public IEnumerable<ProductImageDto> Images { get; set; } = new List<ProductImageDto>();
    
    // Variants
    public IEnumerable<ProductVariantDto> Variants { get; set; } = new List<ProductVariantDto>();
    
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? FabricAndCare { get; set; }
    public string? ShippingAndReturns { get; set; }
    
    // ilyn.global Design Fields
    public string? Tier { get; set; }
    public string? Tags { get; set; }
    public int SortOrder { get; set; }

    public ProductType ProductType { get; set; }

    // Simplified Bundle System
    public bool IsBundle { get; set; }
    public int BundleQuantity { get; set; }
}

public class ProductImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public string? Label { get; set; }
    public bool IsPrimary { get; set; }
    public string Type { get; set; } = string.Empty;
}

public class ProductVariantDto
{
    public int Id { get; set; }
    public string? Sku { get; set; }
    public string? Size { get; set; }
    public decimal? Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public decimal? PurchaseRate { get; set; }
    public int StockQuantity { get; set; }
}

public class ProductBundleItemDto
{
    public int ComponentProductId { get; set; }
    public string? ComponentProductName { get; set; }
    public int? ComponentVariantId { get; set; }
    public string? ComponentVariantName { get; set; }
    public int Quantity { get; set; }
}

public class ProductListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public bool IsNew { get; set; }
    public bool IsFeatured { get; set; }


    public bool IsActive { get; set; }
    public bool IsItemProduct { get; set; }
    public string? Tier { get; set; }
    public string? CollectionName { get; set; }

    public List<ProductVariantDto> Variants { get; set; } = new();
    public IEnumerable<ProductImageDto> Images { get; set; } = new List<ProductImageDto>();
}

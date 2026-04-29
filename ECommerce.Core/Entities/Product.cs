using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ECommerce.Core.Enums;

namespace ECommerce.Core.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public string? Sku { get; set; }
    public string? ImageUrl { get; set; }
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; } = true;
    public ProductType ProductType { get; set; } = ProductType.Simple;

    public bool IsNew { get; set; } = false;
    public bool IsFeatured { get; set; } = false;
    
    // Meta Info
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? FabricAndCare { get; set; }
    public string? ShippingAndReturns { get; set; }
    public string? SizeChartUrl { get; set; }
    
    // New Fields
    public string? Tier { get; set; }
    public string? Tags { get; set; }
    public int SortOrder { get; set; }

    // Relations
    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public int? SubCategoryId { get; set; }
    public SubCategory? SubCategory { get; set; }

    public int? CollectionId { get; set; }
    public Collection? Collection { get; set; }

    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

using System.ComponentModel.DataAnnotations.Schema;
using ECommerce.Core.Enums;

namespace ECommerce.Core.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string? ImageUrl { get; set; } // Main image URL for quick access
    public int StockQuantity { get; set; } // Renamed from Stock
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
    
    // ilyn.global Design Fields
    public string? Tier { get; set; } // Premium, Luxury, Platinum, Sahara
    public string? Tags { get; set; } // Comma-separated tags for categorization
    public int SortOrder { get; set; } = 0; // Manual sorting order


    // Foreign Keys
    public int CategoryId { get; set; }
    public Category? Category { get; set; }


    public int? SubCategoryId { get; set; }
    public SubCategory? SubCategory { get; set; }

    public int? CollectionId { get; set; }
    public Collection? Collection { get; set; }
    
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();

}

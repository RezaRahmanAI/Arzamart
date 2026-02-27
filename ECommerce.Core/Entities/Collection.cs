using System.Collections.Generic;

namespace ECommerce.Core.Entities;

public class Collection : BaseEntity
{
    public string Name { get; set; }
    public string Slug { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Foreign Key
    public int SubCategoryId { get; set; }
    public SubCategory SubCategory { get; set; }
    
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

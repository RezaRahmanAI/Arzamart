using System.Collections.Generic;

namespace ECommerce.Core.Entities;

public class SubCategory : BaseEntity
{
    public string Name { get; set; }
    public string Slug { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Foreign Key
    public int CategoryId { get; set; }
    public Category Category { get; set; }
    
    public ICollection<Collection> Collections { get; set; } = new List<Collection>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

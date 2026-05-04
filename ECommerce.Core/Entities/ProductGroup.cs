using System.Collections.Generic;

namespace ECommerce.Core.Entities;

public class ProductGroup : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

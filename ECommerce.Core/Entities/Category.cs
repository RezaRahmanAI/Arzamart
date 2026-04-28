using System;
using System.Collections.Generic;

namespace ECommerce.Core.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public int? ParentId { get; set; }
    public Category? ParentCategory { get; set; }
    public ICollection<Category> ChildCategories { get; set; } = new List<Category>();

    public ICollection<SubCategory> SubCategories { get; set; } = new List<SubCategory>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

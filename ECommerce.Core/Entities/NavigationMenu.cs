using System.Collections.Generic;

namespace ECommerce.Core.Entities;

public class NavigationMenu : BaseEntity
{
    public string Title { get; set; }
    public string? Url { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsMegaMenu { get; set; } = false;
    public string? Icon { get; set; }
    
    // Optional Link to Category
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    
    // Self-Referencing for Hierarchy
    public int? ParentMenuId { get; set; }
    public NavigationMenu? ParentMenu { get; set; }
    public ICollection<NavigationMenu> ChildMenus { get; set; } = new List<NavigationMenu>();
}

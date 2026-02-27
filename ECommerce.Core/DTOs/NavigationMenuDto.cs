using System.Collections.Generic;

namespace ECommerce.Core.DTOs;

public class NavigationMenuDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Link { get; set; }
    public int? ParentMenuId { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public List<NavigationMenuDto> ChildMenus { get; set; } = new List<NavigationMenuDto>();
}

public class NavigationMenuCreateDto
{
    public string Name { get; set; }
    public string Link { get; set; }
    public int? ParentMenuId { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

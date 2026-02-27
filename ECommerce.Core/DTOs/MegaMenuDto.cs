using System.Collections.Generic;

namespace ECommerce.Core.DTOs;

public class MegaMenuDto
{
    public IEnumerable<MegaMenuCategoryDto> Categories { get; set; }
}

public class MegaMenuCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Slug { get; set; }
    public string? Icon { get; set; }
    public IEnumerable<MegaMenuSubCategoryDto> SubCategories { get; set; }
}

public class MegaMenuSubCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Slug { get; set; }
    public IEnumerable<MegaMenuCollectionDto> Collections { get; set; }
}

public class MegaMenuCollectionDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Slug { get; set; }
}

using System.Collections.Generic;

namespace ECommerce.Core.DTOs;

public class MegaMenuDto
{
    public IEnumerable<MegaMenuCategoryDto> Categories { get; set; } = new List<MegaMenuCategoryDto>();
}

public class MegaMenuCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public IEnumerable<MegaMenuSubCategoryDto> SubCategories { get; set; } = new List<MegaMenuSubCategoryDto>();
}

public class MegaMenuSubCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public IEnumerable<MegaMenuCollectionDto> Collections { get; set; } = new List<MegaMenuCollectionDto>();
}

public class MegaMenuCollectionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

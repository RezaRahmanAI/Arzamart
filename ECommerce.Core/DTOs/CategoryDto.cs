namespace ECommerce.Core.DTOs;

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; }
    public int ProductCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? ParentId { get; set; }
    public IEnumerable<SubCategoryDto> SubCategories { get; set; } = new List<SubCategoryDto>();
    public IEnumerable<CategoryDto> ChildCategories { get; set; } = new List<CategoryDto>();
}

public class CategoryCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }

    public bool? IsActive { get; set; }
    public int? DisplayOrder { get; set; }
    public int? ParentId { get; set; }
}

public class CategoryUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }

    public bool? IsActive { get; set; }
    public int? DisplayOrder { get; set; }
    public int? ParentId { get; set; }
}

public class ReorderCategoriesDto
{

    public List<int> OrderedIds { get; set; } = new();
}

public class SubCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public bool IsActive { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public IEnumerable<CollectionDto> Collections { get; set; } = new List<CollectionDto>();
}

public class SubCategoryCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public bool? IsActive { get; set; }
    public int? DisplayOrder { get; set; }
}

public class SubCategoryUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public bool? IsActive { get; set; }
    public int? DisplayOrder { get; set; }
}





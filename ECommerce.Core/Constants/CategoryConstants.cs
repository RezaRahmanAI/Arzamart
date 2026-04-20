using ECommerce.Core.DTOs;
using ECommerce.Core.Enums;
using System.Collections.Generic;

namespace ECommerce.Core.Constants;

public static class CategoryConstants
{
    public static readonly List<CategoryDto> AllCategories = new()
    {
        new CategoryDto
        {
            Id = (int)CategoryType.Men,
            Name = "Men",
            Slug = "men",
            ImageUrl = "",
            IsActive = true,
            DisplayOrder = 1
        },
        new CategoryDto
        {
            Id = (int)CategoryType.Women,
            Name = "Women",
            Slug = "women",
            ImageUrl = "",
            IsActive = true,
            DisplayOrder = 2
        },
        new CategoryDto
        {
            Id = (int)CategoryType.Kids,
            Name = "Kids",
            Slug = "kids",
            ImageUrl = "",
            IsActive = true,
            DisplayOrder = 3
        },
        new CategoryDto
        {
            Id = (int)CategoryType.Accessories,
            Name = "Accessories",
            Slug = "accessories",
            ImageUrl = "",
            IsActive = true,
            DisplayOrder = 4
        }
    };
}

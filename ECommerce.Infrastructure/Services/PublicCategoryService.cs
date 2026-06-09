using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Cache;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class PublicCategoryService : IPublicCategoryService
{
    private readonly AppCache _cache;

    public PublicCategoryService(AppCache cache)
    {
        _cache = cache;
    }

    public Task<List<CategoryDto>> GetAllActiveAsync()
    {
        var categories = _cache.Categories.Values
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ToList();

        var result = categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            ImageUrl = c.ImageUrl,
            DisplayOrder = c.DisplayOrder,
            IsActive = c.IsActive,
            MetaTitle = c.MetaTitle,
            MetaDescription = c.MetaDescription,
            CreatedAt = c.CreatedAt,
            ParentId = c.ParentId,
            SubCategories = c.SubCategories?
                .Where(sc => sc.IsActive)
                .OrderBy(sc => sc.DisplayOrder)
                .Select(sc => new SubCategoryDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    Slug = sc.Slug,
                    ImageUrl = sc.ImageUrl,
                    CategoryId = sc.CategoryId,
                    IsActive = sc.IsActive,
                    DisplayOrder = sc.DisplayOrder,
                    Collections = sc.Collections?
                        .Where(col => col.IsActive)
                        .Select(col => new CollectionDto
                        {
                            Id = col.Id,
                            Name = col.Name,
                            Slug = col.Slug,
                            Description = col.Description,
                            ImageUrl = col.ImageUrl,
                            SubCategoryId = col.SubCategoryId,
                            IsActive = col.IsActive
                        }).ToList() ?? new List<CollectionDto>()
                }).ToList() ?? new List<SubCategoryDto>(),
            ChildCategories = Enumerable.Empty<CategoryDto>()
        }).ToList();

        return Task.FromResult(result);
    }
}

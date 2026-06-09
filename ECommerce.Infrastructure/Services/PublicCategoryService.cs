using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class PublicCategoryService : IPublicCategoryService
{
    private readonly IUnitOfWork _unitOfWork;

    public PublicCategoryService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<CategoryDto>> GetAllActiveAsync()
    {
        var categories = await _unitOfWork.Repository<Category>().GetQueryable()
            .Where(c => c.IsActive)
            .Include(c => c.SubCategories.Where(sc => sc.IsActive))
                .ThenInclude(sc => sc.Collections.Where(col => col.IsActive))
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();

        return categories.Select(c => new CategoryDto
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
            SubCategories = c.SubCategories.Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                ImageUrl = sc.ImageUrl,
                CategoryId = sc.CategoryId,
                IsActive = sc.IsActive,
                DisplayOrder = sc.DisplayOrder,
                Collections = sc.Collections.Select(col => new CollectionDto
                {
                    Id = col.Id,
                    Name = col.Name,
                    Slug = col.Slug,
                    Description = col.Description,
                    ImageUrl = col.ImageUrl,
                    SubCategoryId = col.SubCategoryId,
                    IsActive = col.IsActive
                }).ToList()
            }).ToList(),
            ChildCategories = Enumerable.Empty<CategoryDto>()
        }).ToList();
    }
}

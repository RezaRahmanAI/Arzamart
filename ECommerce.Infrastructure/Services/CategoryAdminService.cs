using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class CategoryAdminService : ICategoryAdminService
{
    private readonly IUnitOfWork _unitOfWork;

    public CategoryAdminService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<CategoryDto>> GetAllAsync()
    {
        var categories = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .AsNoTracking()
            .Include(c => c.SubCategories)
                .ThenInclude(sc => sc.Collections)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();

        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            ImageUrl = c.ImageUrl,
            IsActive = c.IsActive,
            DisplayOrder = c.DisplayOrder,
            MetaTitle = c.MetaTitle,
            MetaDescription = c.MetaDescription,
            CreatedAt = c.CreatedAt,
            ParentId = c.ParentId,
            SubCategories = c.SubCategories.Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                CategoryId = sc.CategoryId,
                IsActive = sc.IsActive,
                ImageUrl = sc.ImageUrl,
                DisplayOrder = sc.DisplayOrder,
                Collections = sc.Collections.Select(col => new CollectionDto
                {
                    Id = col.Id,
                    Name = col.Name,
                    Slug = col.Slug
                }).ToList()
            }).ToList()
        }).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var c = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .AsNoTracking()
            .Include(c => c.SubCategories)
                .ThenInclude(sc => sc.Collections)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (c == null) return null;

        return new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            ImageUrl = c.ImageUrl,
            IsActive = c.IsActive,
            DisplayOrder = c.DisplayOrder,
            MetaTitle = c.MetaTitle,
            MetaDescription = c.MetaDescription,
            CreatedAt = c.CreatedAt,
            ParentId = c.ParentId,
            SubCategories = c.SubCategories.Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                CategoryId = sc.CategoryId,
                IsActive = sc.IsActive,
                ImageUrl = sc.ImageUrl,
                DisplayOrder = sc.DisplayOrder,
                Collections = sc.Collections.Select(col => new CollectionDto
                {
                    Id = col.Id,
                    Name = col.Name,
                    Slug = col.Slug
                }).ToList()
            }).ToList()
        };
    }

    public async Task<CategoryDto> CreateAsync(CategoryCreateDto dto)
    {
        var slug = string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Name) : dto.Slug;

        var slugExists = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .AnyAsync(c => c.Slug == slug);

        if (slugExists)
            throw new InvalidOperationException("A category with this slug already exists");

        var category = new Category
        {
            Name = dto.Name,
            Slug = slug,
            ImageUrl = dto.ImageUrl,
            MetaTitle = dto.MetaTitle,
            MetaDescription = dto.MetaDescription,
            IsActive = dto.IsActive ?? true,
            DisplayOrder = dto.DisplayOrder ?? 0,
            ParentId = dto.ParentId
        };

        _unitOfWork.Repository<Category>().Add(category);
        await _unitOfWork.Complete();

        return await GetByIdAsync(category.Id) ?? throw new InvalidOperationException("Failed to retrieve created category");
    }

    public async Task UpdateAsync(int id, CategoryUpdateDto dto)
    {
        var category = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            throw new InvalidOperationException($"Category with ID {id} not found");

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            category.Name = dto.Name;
            if (string.IsNullOrWhiteSpace(dto.Slug))
                category.Slug = GenerateSlug(dto.Name);
        }

        if (!string.IsNullOrWhiteSpace(dto.Slug))
        {
            var slug = dto.Slug.ToLower().Replace(" ", "-");
            var slugExists = await _unitOfWork.Repository<Category>()
                .GetQueryable()
                .AnyAsync(c => c.Slug == slug && c.Id != id);

            if (slugExists)
                throw new InvalidOperationException("A category with this slug already exists");

            category.Slug = slug;
        }

        category.ImageUrl = dto.ImageUrl;
        category.MetaTitle = dto.MetaTitle;
        category.MetaDescription = dto.MetaDescription;
        category.IsActive = dto.IsActive ?? category.IsActive;
        category.DisplayOrder = dto.DisplayOrder ?? category.DisplayOrder;
        category.ParentId = dto.ParentId;
        category.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();
    }

    public async Task DeleteAsync(int id)
    {
        var category = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .Include(c => c.SubCategories)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            throw new InvalidOperationException($"Category with ID {id} not found");

        if (category.SubCategories.Any() || category.Products.Any())
            throw new InvalidOperationException("Cannot delete category that has sub-categories or products. Please delete or move them first.");

        _unitOfWork.Repository<Category>().Delete(category);
        await _unitOfWork.Complete();
    }

    public async Task ReorderAsync(List<int> sortedIds)
    {
        if (sortedIds == null || sortedIds.Count == 0)
            throw new InvalidOperationException("No IDs provided");

        var categories = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .ToListAsync();

        for (int i = 0; i < sortedIds.Count; i++)
        {
            var cat = categories.FirstOrDefault(c => c.Id == sortedIds[i]);
            if (cat != null)
            {
                cat.DisplayOrder = i;
            }
        }

        await _unitOfWork.Complete();
    }

    private static string GenerateSlug(string name)
    {
        return name.ToLower()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("\"", "")
            .Replace("'", "");
    }
}

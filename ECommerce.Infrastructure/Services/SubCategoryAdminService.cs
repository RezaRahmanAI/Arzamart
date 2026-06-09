using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class SubCategoryAdminService : ISubCategoryAdminService
{
    private readonly IUnitOfWork _unitOfWork;

    public SubCategoryAdminService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<SubCategoryDto>> GetAllAsync()
    {
        return await _unitOfWork.Repository<SubCategory>()
            .GetQueryable()
            .AsNoTracking()
            .OrderBy(sc => sc.CategoryId)
            .ThenBy(sc => sc.DisplayOrder)
            .Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                CategoryId = sc.CategoryId,
                IsActive = sc.IsActive,
                ImageUrl = sc.ImageUrl,
                DisplayOrder = sc.DisplayOrder
            })
            .ToListAsync();
    }

    public async Task<SubCategoryDto?> GetByIdAsync(int id)
    {
        var sc = await _unitOfWork.Repository<SubCategory>()
            .GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (sc == null) return null;

        return new SubCategoryDto
        {
            Id = sc.Id,
            Name = sc.Name,
            Slug = sc.Slug,
            CategoryId = sc.CategoryId,
            IsActive = sc.IsActive,
            ImageUrl = sc.ImageUrl,
            DisplayOrder = sc.DisplayOrder
        };
    }

    public async Task<SubCategoryDto> CreateAsync(SubCategoryCreateDto dto)
    {
        var categoryExists = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .AnyAsync(c => c.Id == dto.CategoryId);

        if (!categoryExists)
            throw new InvalidOperationException($"Category with ID {dto.CategoryId} not found");

        var slug = string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Name) : dto.Slug;

        var subCategory = new SubCategory
        {
            Name = dto.Name,
            Slug = slug,
            CategoryId = dto.CategoryId,
            ImageUrl = dto.ImageUrl,
            IsActive = dto.IsActive ?? true,
            DisplayOrder = dto.DisplayOrder ?? 0
        };

        _unitOfWork.Repository<SubCategory>().Add(subCategory);
        await _unitOfWork.Complete();

        return new SubCategoryDto
        {
            Id = subCategory.Id,
            Name = subCategory.Name,
            Slug = subCategory.Slug,
            CategoryId = subCategory.CategoryId,
            IsActive = subCategory.IsActive,
            ImageUrl = subCategory.ImageUrl,
            DisplayOrder = subCategory.DisplayOrder
        };
    }

    public async Task<SubCategoryDto> UpdateAsync(int id, SubCategoryUpdateDto dto)
    {
        var subCategory = await _unitOfWork.Repository<SubCategory>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (subCategory == null)
            throw new InvalidOperationException($"SubCategory with ID {id} not found");

        var categoryExists = await _unitOfWork.Repository<Category>()
            .GetQueryable()
            .AnyAsync(c => c.Id == dto.CategoryId);

        if (!categoryExists)
            throw new InvalidOperationException($"Category with ID {dto.CategoryId} not found");

        subCategory.CategoryId = dto.CategoryId;
        subCategory.Name = dto.Name;
        subCategory.Slug = string.IsNullOrWhiteSpace(dto.Slug) ? GenerateSlug(dto.Name) : dto.Slug;

        if (dto.IsActive.HasValue) subCategory.IsActive = dto.IsActive.Value;
        if (dto.DisplayOrder.HasValue) subCategory.DisplayOrder = dto.DisplayOrder.Value;
        if (dto.ImageUrl != null) subCategory.ImageUrl = dto.ImageUrl;

        subCategory.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();

        return new SubCategoryDto
        {
            Id = subCategory.Id,
            Name = subCategory.Name,
            Slug = subCategory.Slug,
            CategoryId = subCategory.CategoryId,
            IsActive = subCategory.IsActive,
            ImageUrl = subCategory.ImageUrl,
            DisplayOrder = subCategory.DisplayOrder
        };
    }

    public async Task DeleteAsync(int id)
    {
        var subCategory = await _unitOfWork.Repository<SubCategory>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (subCategory == null)
            throw new InvalidOperationException($"SubCategory with ID {id} not found");

        _unitOfWork.Repository<SubCategory>().Delete(subCategory);
        await _unitOfWork.Complete();
    }

    private static string GenerateSlug(string name)
    {
        return name.ToLower()
            .Replace(" ", "-")
            .Replace("?", "")
            .Replace("!", "")
            .Replace(".", "")
            .Replace(",", "")
            .Replace("'", "")
            .Replace("\"", "");
    }
}

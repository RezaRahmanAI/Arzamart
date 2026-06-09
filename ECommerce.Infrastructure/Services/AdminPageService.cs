using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class AdminPageService : IAdminPageService
{
    private readonly IUnitOfWork _unitOfWork;

    public AdminPageService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<PageDto>> GetAllAsync()
    {
        return await _unitOfWork.Repository<Page>()
            .GetQueryable()
            .AsNoTracking()
            .Select(p => new PageDto
            {
                Id = p.Id,
                Title = p.Title,
                Slug = p.Slug,
                Content = p.Content ?? "",
                MetaTitle = p.MetaTitle ?? "",
                MetaDescription = p.MetaDescription ?? "",
                IsActive = p.IsActive
            })
            .ToListAsync();
    }

    public async Task<PageDto?> GetByIdAsync(int id)
    {
        var page = await _unitOfWork.Repository<Page>()
            .GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (page == null) return null;

        return new PageDto
        {
            Id = page.Id,
            Title = page.Title,
            Slug = page.Slug,
            Content = page.Content ?? "",
            MetaTitle = page.MetaTitle ?? "",
            MetaDescription = page.MetaDescription ?? "",
            IsActive = page.IsActive
        };
    }

    public async Task<PageDto> CreateAsync(PageCreateDto dto)
    {
        var page = new Page
        {
            Title = dto.Title,
            Slug = dto.Slug,
            Content = dto.Content,
            MetaTitle = dto.MetaTitle,
            MetaDescription = dto.MetaDescription,
            IsActive = dto.IsActive
        };

        _unitOfWork.Repository<Page>().Add(page);
        await _unitOfWork.Complete();

        return new PageDto
        {
            Id = page.Id,
            Title = page.Title,
            Slug = page.Slug,
            Content = page.Content ?? "",
            MetaTitle = page.MetaTitle ?? "",
            MetaDescription = page.MetaDescription ?? "",
            IsActive = page.IsActive
        };
    }

    public async Task<PageDto> UpdateAsync(int id, PageCreateDto dto)
    {
        var page = await _unitOfWork.Repository<Page>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (page == null)
            throw new InvalidOperationException($"Page with ID {id} not found");

        page.Title = dto.Title;
        page.Slug = dto.Slug;
        page.Content = dto.Content;
        page.MetaTitle = dto.MetaTitle;
        page.MetaDescription = dto.MetaDescription;
        page.IsActive = dto.IsActive;
        page.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();

        return new PageDto
        {
            Id = page.Id,
            Title = page.Title,
            Slug = page.Slug,
            Content = page.Content ?? "",
            MetaTitle = page.MetaTitle ?? "",
            MetaDescription = page.MetaDescription ?? "",
            IsActive = page.IsActive
        };
    }

    public async Task DeleteAsync(int id)
    {
        var page = await _unitOfWork.Repository<Page>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (page == null)
            throw new InvalidOperationException($"Page with ID {id} not found");

        _unitOfWork.Repository<Page>().Delete(page);
        await _unitOfWork.Complete();
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class AdminSocialMediaSourceService : IAdminSocialMediaSourceService
{
    private readonly IUnitOfWork _unitOfWork;

    public AdminSocialMediaSourceService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<SocialMediaSourceDto>> GetAllAsync()
    {
        return await _unitOfWork.Repository<SocialMediaSource>()
            .GetQueryable()
            .Select(p => new SocialMediaSourceDto
            {
                Id = p.Id,
                Name = p.Name,
                IsActive = p.IsActive
            })
            .ToListAsync();
    }

    public async Task<List<SocialMediaSourceDto>> GetActiveAsync()
    {
        return await _unitOfWork.Repository<SocialMediaSource>()
            .GetQueryable()
            .Where(p => p.IsActive)
            .Select(p => new SocialMediaSourceDto
            {
                Id = p.Id,
                Name = p.Name,
                IsActive = p.IsActive
            })
            .ToListAsync();
    }

    public async Task<SocialMediaSourceDto?> GetByIdAsync(int id)
    {
        var entity = await _unitOfWork.Repository<SocialMediaSource>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null) return null;

        return new SocialMediaSourceDto
        {
            Id = entity.Id,
            Name = entity.Name,
            IsActive = entity.IsActive
        };
    }

    public async Task<SocialMediaSourceDto> CreateAsync(SocialMediaSourceCreateDto dto)
    {
        var entity = new SocialMediaSource
        {
            Name = dto.Name,
            IsActive = dto.IsActive
        };

        _unitOfWork.Repository<SocialMediaSource>().Add(entity);
        await _unitOfWork.Complete();

        return new SocialMediaSourceDto
        {
            Id = entity.Id,
            Name = entity.Name,
            IsActive = entity.IsActive
        };
    }

    public async Task<SocialMediaSourceDto> UpdateAsync(int id, SocialMediaSourceCreateDto dto)
    {
        var entity = await _unitOfWork.Repository<SocialMediaSource>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
            throw new InvalidOperationException($"SocialMediaSource with ID {id} not found");

        entity.Name = dto.Name;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();

        return new SocialMediaSourceDto
        {
            Id = entity.Id,
            Name = entity.Name,
            IsActive = entity.IsActive
        };
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _unitOfWork.Repository<SocialMediaSource>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
            throw new InvalidOperationException($"SocialMediaSource with ID {id} not found");

        _unitOfWork.Repository<SocialMediaSource>().Delete(entity);
        await _unitOfWork.Complete();
    }
}

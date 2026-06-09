using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class AdminSourcePageService : IAdminSourcePageService
{
    private readonly IUnitOfWork _unitOfWork;

    public AdminSourcePageService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<SourcePageDto>> GetAllAsync()
    {
        return await _unitOfWork.Repository<SourcePage>()
            .GetQueryable()
            .Select(p => new SourcePageDto
            {
                Id = p.Id,
                Name = p.Name,
                IsActive = p.IsActive
            })
            .ToListAsync();
    }

    public async Task<List<SourcePageDto>> GetActiveAsync()
    {
        return await _unitOfWork.Repository<SourcePage>()
            .GetQueryable()
            .Where(p => p.IsActive)
            .Select(p => new SourcePageDto
            {
                Id = p.Id,
                Name = p.Name,
                IsActive = p.IsActive
            })
            .ToListAsync();
    }

    public async Task<SourcePageDto?> GetByIdAsync(int id)
    {
        var entity = await _unitOfWork.Repository<SourcePage>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null) return null;

        return new SourcePageDto
        {
            Id = entity.Id,
            Name = entity.Name,
            IsActive = entity.IsActive
        };
    }

    public async Task<SourcePageDto> CreateAsync(SourcePageCreateDto dto)
    {
        var entity = new SourcePage
        {
            Name = dto.Name,
            IsActive = dto.IsActive
        };

        _unitOfWork.Repository<SourcePage>().Add(entity);
        await _unitOfWork.Complete();

        return new SourcePageDto
        {
            Id = entity.Id,
            Name = entity.Name,
            IsActive = entity.IsActive
        };
    }

    public async Task<SourcePageDto> UpdateAsync(int id, SourcePageCreateDto dto)
    {
        var entity = await _unitOfWork.Repository<SourcePage>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
            throw new InvalidOperationException($"SourcePage with ID {id} not found");

        entity.Name = dto.Name;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Complete();

        return new SourcePageDto
        {
            Id = entity.Id,
            Name = entity.Name,
            IsActive = entity.IsActive
        };
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _unitOfWork.Repository<SourcePage>()
            .GetQueryable()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null)
            throw new InvalidOperationException($"SourcePage with ID {id} not found");

        _unitOfWork.Repository<SourcePage>().Delete(entity);
        await _unitOfWork.Complete();
    }
}

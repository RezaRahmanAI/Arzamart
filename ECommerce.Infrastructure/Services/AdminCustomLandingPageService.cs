using System;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class AdminCustomLandingPageService : IAdminCustomLandingPageService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AdminCustomLandingPageService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<CustomLandingPageConfigDto?> GetConfigAsync(int productId)
    {
        var config = await _unitOfWork.Repository<CustomLandingPageConfig>()
            .GetQueryable()
            .FirstOrDefaultAsync(c => c.ProductId == productId);

        if (config == null) return null;

        return _mapper.Map<CustomLandingPageConfigDto>(config);
    }

    public async Task<CustomLandingPageConfigDto> SaveConfigAsync(CustomLandingPageConfigUpdateDto dto)
    {
        var config = await _unitOfWork.Repository<CustomLandingPageConfig>()
            .GetQueryable()
            .FirstOrDefaultAsync(c => c.ProductId == dto.ProductId);

        if (config == null)
        {
            config = _mapper.Map<CustomLandingPageConfig>(dto);
            _unitOfWork.Repository<CustomLandingPageConfig>().Add(config);
        }
        else
        {
            _mapper.Map(dto, config);
            config.UpdatedAt = DateTime.UtcNow;
        }

        await _unitOfWork.Complete();

        return _mapper.Map<CustomLandingPageConfigDto>(config);
    }
}

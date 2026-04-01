using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class AdultProductService : IAdultProductService
{
    private readonly ApplicationDbContext _context;

    public AdultProductService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AdultProductDto>> GetAllAsync()
    {
        return await _context.AdultProducts
            .Select(p => MapToDto(p))
            .ToListAsync();
    }

    public async Task<AdultProductDto?> GetByIdAsync(int id)
    {
        var product = await _context.AdultProducts.FindAsync(id);
        return product != null ? MapToDto(product) : null;
    }

    public async Task<AdultProductDto?> GetBySlugAsync(string slug)
    {
        var product = await _context.AdultProducts.FirstOrDefaultAsync(p => p.Slug == slug);
        return product != null ? MapToDto(product) : null;
    }

    public async Task<AdultProductDto> CreateAsync(AdultProductCreateUpdateDto dto)
    {
        var product = new AdultProduct
        {
            Headline = dto.Headline,
            Slug = dto.Slug,
            Subtitle = dto.Subtitle,
            ImgUrl = dto.ImgUrl,
            BenefitsTitle = dto.BenefitsTitle,
            BenefitsContent = dto.BenefitsContent,
            SideEffectsTitle = dto.SideEffectsTitle,
            SideEffectsContent = dto.SideEffectsContent,
            Price = dto.Price,
            CompareAtPrice = dto.CompareAtPrice,
            IsActive = dto.IsActive,
            UsageTitle = dto.UsageTitle,
            UsageContent = dto.UsageContent,
            CreatedAt = DateTime.UtcNow
        };

        _context.AdultProducts.Add(product);
        await _context.SaveChangesAsync();

        return MapToDto(product);
    }

    public async Task<bool> UpdateAsync(int id, AdultProductCreateUpdateDto dto)
    {
        var product = await _context.AdultProducts.FindAsync(id);
        if (product == null) return false;

        product.Headline = dto.Headline;
        product.Slug = dto.Slug;
        product.Subtitle = dto.Subtitle;
        product.ImgUrl = dto.ImgUrl;
        product.BenefitsTitle = dto.BenefitsTitle;
        product.BenefitsContent = dto.BenefitsContent;
        product.SideEffectsTitle = dto.SideEffectsTitle;
        product.SideEffectsContent = dto.SideEffectsContent;
        product.Price = dto.Price;
        product.CompareAtPrice = dto.CompareAtPrice;
        product.IsActive = dto.IsActive;
        product.UsageTitle = dto.UsageTitle;
        product.UsageContent = dto.UsageContent;
        product.UpdatedAt = DateTime.UtcNow;

        _context.Entry(product).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _context.AdultProducts.FindAsync(id);
        if (product == null) return false;

        _context.AdultProducts.Remove(product);
        return await _context.SaveChangesAsync() > 0;
    }

    private static AdultProductDto MapToDto(AdultProduct p)
    {
        return new AdultProductDto
        {
            Id = p.Id,
            Headline = p.Headline,
            Slug = p.Slug,
            Subtitle = p.Subtitle,
            ImgUrl = p.ImgUrl,
            BenefitsTitle = p.BenefitsTitle,
            BenefitsContent = p.BenefitsContent,
            SideEffectsTitle = p.SideEffectsTitle,
            SideEffectsContent = p.SideEffectsContent,
            Price = p.Price,
            CompareAtPrice = p.CompareAtPrice,
            IsActive = p.IsActive,
            UsageTitle = p.UsageTitle,
            UsageContent = p.UsageContent,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        };
    }
}

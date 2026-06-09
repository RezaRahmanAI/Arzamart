using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class InventoryService : IInventoryService
{
    private readonly IUnitOfWork _unitOfWork;

    public InventoryService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<ProductInventoryDto>> GetInventoryAsync()
    {
        var products = await _unitOfWork.Repository<Product>().GetQueryable()
            .Include(p => p.Variants)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return products.Select(p => new ProductInventoryDto
        {
            ProductId = p.Id,
            ProductName = p.Name,
            ProductSku = p.Sku ?? string.Empty,
            ProductSlug = p.Slug,
            ImageUrl = p.ImageUrl ?? string.Empty,
            TotalStock = p.Variants.Any() ? p.Variants.Sum(v => v.StockQuantity) : p.StockQuantity,
            StockQuantity = p.StockQuantity,
            Price = p.Variants.FirstOrDefault()?.Price,
            CompareAtPrice = p.Variants.FirstOrDefault()?.CompareAtPrice,
            PurchaseRate = p.Variants.FirstOrDefault()?.PurchaseRate,
            Variants = p.Variants.Select(v => new VariantInventoryDto
            {
                VariantId = v.Id,
                Sku = v.Sku ?? string.Empty,
                Size = v.Size ?? string.Empty,
                StockQuantity = v.StockQuantity,
                Price = v.Price,
                CompareAtPrice = v.CompareAtPrice,
                PurchaseRate = v.PurchaseRate
            }).ToList()
        }).ToList();
    }

    public async Task UpdateStockAsync(int variantId, UpdateInventoryDto dto)
    {
        var variant = await _unitOfWork.Repository<ProductVariant>().GetQueryable()
            .FirstOrDefaultAsync(v => v.Id == variantId);

        if (variant == null)
            throw new InvalidOperationException($"Variant with id {variantId} not found.");

        var product = await _unitOfWork.Repository<Product>().GetQueryable()
            .FirstOrDefaultAsync(p => p.Id == variant.ProductId);

        if (product == null)
            throw new InvalidOperationException($"Product for variant {variantId} not found.");

        variant.StockQuantity = dto.Quantity;
        if (dto.Price.HasValue)
            variant.Price = dto.Price;
        if (dto.CompareAtPrice.HasValue)
            variant.CompareAtPrice = dto.CompareAtPrice;
        if (dto.PurchaseRate.HasValue)
            variant.PurchaseRate = dto.PurchaseRate;

        var variants = await _unitOfWork.Repository<ProductVariant>().GetQueryable()
            .Where(v => v.ProductId == product.Id)
            .ToListAsync();

        product.StockQuantity = variants.Sum(v => v.StockQuantity);

        await _unitOfWork.Complete();
    }

    public async Task UpdateProductStockAsync(int productId, UpdateInventoryDto dto)
    {
        var product = await _unitOfWork.Repository<Product>().GetQueryable()
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
            throw new InvalidOperationException($"Product with id {productId} not found.");

        if (product.Variants.Any())
        {
            product.StockQuantity = product.Variants.Sum(v => v.StockQuantity);

            if (dto.Price.HasValue)
            {
                foreach (var variant in product.Variants)
                    variant.Price = dto.Price;
            }
            if (dto.CompareAtPrice.HasValue)
            {
                foreach (var variant in product.Variants)
                    variant.CompareAtPrice = dto.CompareAtPrice;
            }
            if (dto.PurchaseRate.HasValue)
            {
                foreach (var variant in product.Variants)
                    variant.PurchaseRate = dto.PurchaseRate;
            }
        }
        else
        {
            product.StockQuantity = dto.Quantity;
        }

        await _unitOfWork.Complete();
    }

    public async Task<int> SyncAllInventoryAsync()
    {
        var products = await _unitOfWork.Repository<Product>().GetQueryable()
            .Include(p => p.Variants)
            .ToListAsync();

        var fixedCount = 0;

        foreach (var product in products)
        {
            if (product.Variants.Any())
            {
                var sum = product.Variants.Sum(v => v.StockQuantity);
                if (product.StockQuantity != sum)
                {
                    product.StockQuantity = sum;
                    fixedCount++;
                }
            }
        }

        await _unitOfWork.Complete();
        return fixedCount;
    }
}

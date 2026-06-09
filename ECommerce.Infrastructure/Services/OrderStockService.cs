using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Specifications;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.Enums;

namespace ECommerce.Infrastructure.Services;

public class OrderStockService : IOrderStockService
{
    private readonly IUnitOfWork _unitOfWork;

    public OrderStockService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public bool ShouldDeductStock(ECommerce.Core.Domain.Orders.OrderStatus status)
    {
        return status switch
        {
            ECommerce.Core.Domain.Orders.OrderStatus.Confirmed => true,
            ECommerce.Core.Domain.Orders.OrderStatus.Processing => true,
            ECommerce.Core.Domain.Orders.OrderStatus.Packed => true,
            ECommerce.Core.Domain.Orders.OrderStatus.Shipped => true,
            ECommerce.Core.Domain.Orders.OrderStatus.Delivered => true,
            _ => false
        };
    }

    public async Task AdjustStockOnStatusChangeAsync(Order order, bool returnToStock)
    {
        if (order.IsPreOrder) return;

        var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _unitOfWork.Repository<Product>().ListAsync(
            new ProductsWithCategoriesSpecification(productIds), track: true);
        var productDict = products.ToDictionary(p => p.Id);

        foreach (var item in order.Items)
        {
            if (productDict.TryGetValue(item.ProductId, out var product))
            {
                await ProcessProductStockAdjustmentAsync(product, item.Quantity, item.Size, returnToStock);
            }
        }
    }

    public async Task<bool> CheckIsProductStockAvailableAsync(Product product, int quantity, string? size)
    {
        if (product.ProductType == ProductType.Combo)
        {
            foreach (var comboItem in product.ComboItems)
            {
                var childProduct = comboItem.Product;
                if (childProduct == null)
                {
                    var spec = new ProductsWithCategoriesSpecification(comboItem.ProductId);
                    childProduct = await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec);
                }

                if (childProduct == null) return false;

                string? childSize = comboItem.ProductVariant?.Size;
                if (!await CheckIsProductStockAvailableAsync(childProduct, quantity * comboItem.Quantity, childSize))
                {
                    return false;
                }
            }
            return true;
        }
        else
        {
            int needed = quantity;
            if (!string.IsNullOrEmpty(size))
            {
                var normalizedSize = size.Trim().ToLower();
                var variant = product.Variants.FirstOrDefault(v => 
                    v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
                return variant != null && variant.StockQuantity >= needed;
            }
            else
            {
                return product.StockQuantity >= needed;
            }
        }
    }

    public async Task PopulateItemsStockStatusAsync(Order order, OrderDto dto)
    {
        if (!order.Items.Any()) return;

        var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _unitOfWork.Repository<Product>().ListAsync(
            new ProductsWithCategoriesSpecification(productIds));
        var productDict = products.ToDictionary(p => p.Id);

        foreach (var itemDto in dto.Items)
        {
            if (productDict.TryGetValue(itemDto.ProductId, out var product))
            {
                itemDto.IsStockAvailable = await CheckIsProductStockAvailableAsync(product, itemDto.Quantity, itemDto.Size);
            }
        }
        
        dto.IsStockAvailable = dto.Items.All(i => i.IsStockAvailable);
    }

    public async Task<bool> CalculateIsStockAvailableAsync(Order order)
    {
        if (!order.Items.Any()) return false;

        var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _unitOfWork.Repository<Product>().ListAsync(
            new ProductsWithCategoriesSpecification(productIds));
        var productDict = products.ToDictionary(p => p.Id);

        foreach (var item in order.Items)
        {
            if (!productDict.TryGetValue(item.ProductId, out var product)) return false;

            if (!await CheckIsProductStockAvailableAsync(product, item.Quantity, item.Size))
            {
                return false;
            }
        }

        return true;
    }

    public async Task ProcessProductStockAdjustmentAsync(Product product, int quantity, string? size, bool returnToStock)
    {
        if (product.ProductType == ProductType.Combo)
        {
            foreach (var comboItem in product.ComboItems)
            {
                var childProduct = comboItem.Product;
                if (childProduct == null)
                {
                    var spec = new ProductsWithCategoriesSpecification(comboItem.ProductId);
                    childProduct = await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec, track: true);
                }

                if (childProduct != null)
                {
                    string? childSize = comboItem.ProductVariant?.Size;
                    await ProcessProductStockAdjustmentAsync(childProduct, quantity * comboItem.Quantity, childSize, returnToStock);
                }
            }
        }
        else
        {
            int totalChange = quantity;

            if (returnToStock)
            {
                product.StockQuantity += totalChange;
            }
            else
            {
                if (product.StockQuantity < totalChange)
                    throw new ECommerce.Core.Domain.Orders.InsufficientStockException(product.Id, product.Name, totalChange, product.StockQuantity);
                product.StockQuantity -= totalChange;
            }

            if (!string.IsNullOrEmpty(size))
            {
                var normalizedSize = size.Trim().ToLower();
                var variant = product.Variants.FirstOrDefault(v => 
                    v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
                
                if (variant != null)
                {
                    if (returnToStock)
                    {
                        variant.StockQuantity += totalChange;
                    }
                    else
                    {
                        if (variant.StockQuantity < totalChange)
                            throw new ECommerce.Core.Domain.Orders.InsufficientStockException(product.Id, product.Name, totalChange, variant.StockQuantity, variant.Size);
                        variant.StockQuantity -= totalChange;
                    }
                    
                    _unitOfWork.Repository<ProductVariant>().Update(variant);
                }
            }
            _unitOfWork.Repository<Product>().Update(product);
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Products;
using ECommerce.Core.Entities;
using ECommerce.Core.Enums;

namespace ECommerce.Infrastructure.Services;

/// <summary>
/// Handles DTO-to-entity mapping and child-collection sync logic for Products.
/// Extracted from ProductService to keep it focused on orchestration.
/// </summary>
public static class ProductFactory
{
    public static Product MapToEntity(ProductCreateDto dto, int categoryId, int? subCategoryId, int? collectionId, string slug)
    {
        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            ShortDescription = dto.ShortDescription,
            StockQuantity = dto.InventoryVariants.Sum(v => v.Inventory),
            IsActive = dto.StatusActive,
            CategoryId = categoryId,
            ImageUrl = dto.Media?.MainImage?.ImageUrl ?? string.Empty,
            IsNew = dto.NewArrival,
            IsFeatured = dto.IsFeatured,
            Slug = slug,
            Sku = $"PRD-{DateTime.UtcNow.Ticks}",
            FabricAndCare = dto.Meta?.FabricAndCare,
            ShippingAndReturns = dto.Meta?.ShippingAndReturns,
            SizeChartUrl = dto.Meta?.SizeChartUrl,
            Tier = dto.Tier,
            Tags = dto.Tags,
            SortOrder = dto.SortOrder,
            BundleSize = dto.BundleSize,
            SubCategoryId = subCategoryId,
            CollectionId = collectionId,
            ProductType = dto.ProductType,
            ProductGroupId = dto.ProductGroupId
        };

        SyncImages(product, dto.Media);
        SyncVariants(product, dto.InventoryVariants);
        SyncComboItems(product, dto.ComboItems, dto.ProductType);

        return product;
    }

    public static void ApplyUpdate(Product product, ProductUpdateDto dto, int categoryId, int? subCategoryId, int? collectionId)
    {
        product.Name = dto.Name;
        product.Description = dto.Description;
        product.ShortDescription = dto.ShortDescription;
        product.IsActive = dto.StatusActive;
        product.CategoryId = categoryId;
        product.ImageUrl = dto.Media?.MainImage?.ImageUrl ?? string.Empty;
        product.IsNew = dto.NewArrival;
        product.IsFeatured = dto.IsFeatured;
        product.FabricAndCare = dto.Meta?.FabricAndCare;
        product.ShippingAndReturns = dto.Meta?.ShippingAndReturns;
        product.SizeChartUrl = dto.Meta?.SizeChartUrl;
        product.Tier = dto.Tier;
        product.Tags = dto.Tags;
        product.SortOrder = dto.SortOrder;
        product.BundleSize = dto.BundleSize;
        product.SubCategoryId = subCategoryId;
        product.CollectionId = collectionId;
        product.ProductType = dto.ProductType;
        product.ProductGroupId = dto.ProductGroupId;
        product.StockQuantity = dto.InventoryVariants.Sum(v => v.Inventory);
    }

    public static void SyncImages(Product product, ProductMediaDto? media)
    {
        product.Images.Clear();

        if (media?.MainImage != null)
        {
            product.Images.Add(new ProductImage
            {
                Url = media.MainImage.ImageUrl ?? string.Empty,
                AltText = media.MainImage.Alt,
                Label = media.MainImage.Label,
                MediaType = media.MainImage.Type ?? "image",
                IsMain = true
            });
        }

        foreach (var thumb in media?.Thumbnails ?? new())
        {
            product.Images.Add(new ProductImage
            {
                Url = thumb.ImageUrl ?? string.Empty,
                AltText = thumb.Alt,
                Label = thumb.Label,
                MediaType = thumb.Type ?? "image",
                IsMain = false
            });
        }
    }

    public static void SyncVariants(Product product, List<ProductVariantEditDto> incomingVariants)
    {
        var existingVariants = product.Variants.ToList();

        // Remove variants not in incoming list
        foreach (var existing in existingVariants)
        {
            if (!incomingVariants.Any(iv => iv.Id == existing.Id))
            {
                product.Variants.Remove(existing);
            }
        }

        // Add or update
        foreach (var iv in incomingVariants)
        {
            if (iv.Id.HasValue && iv.Id > 0)
            {
                var existing = product.Variants.FirstOrDefault(v => v.Id == iv.Id);
                if (existing != null)
                {
                    existing.Sku = iv.Sku;
                    existing.Price = iv.SalePrice ?? iv.Price;
                    existing.CompareAtPrice = iv.SalePrice.HasValue ? iv.Price : null;
                    existing.PurchaseRate = iv.PurchaseRate;
                    existing.StockQuantity = iv.Inventory;
                    existing.Size = iv.Label;
                }
            }
            else
            {
                product.Variants.Add(new ProductVariant
                {
                    Sku = iv.Sku,
                    Price = iv.SalePrice ?? iv.Price,
                    CompareAtPrice = iv.SalePrice.HasValue ? iv.Price : null,
                    PurchaseRate = iv.PurchaseRate,
                    StockQuantity = iv.Inventory,
                    Size = iv.Label
                });
            }
        }
    }

    public static void SyncComboItems(Product product, List<ComboItemDto>? incomingComboItems, ProductType productType)
    {
        var existingComboItems = product.ComboItems.ToList();
        var incoming = incomingComboItems ?? new List<ComboItemDto>();

        // Remove combo items not in incoming list
        foreach (var existing in existingComboItems)
        {
            if (!incoming.Any(ici => ici.Id == existing.Id))
            {
                product.ComboItems.Remove(existing);
            }
        }

        // Add or update
        if (productType == ProductType.Combo)
        {
            foreach (var ici in incoming)
            {
                if (ici.Id.HasValue && ici.Id > 0)
                {
                    var existing = product.ComboItems.FirstOrDefault(ci => ci.Id == ici.Id);
                    if (existing != null)
                    {
                        existing.ProductId = ici.ProductId;
                        existing.ProductVariantId = ici.ProductVariantId;
                        existing.Quantity = ici.Quantity;
                    }
                }
                else
                {
                    product.ComboItems.Add(new ComboItem
                    {
                        ProductId = ici.ProductId,
                        ProductVariantId = ici.ProductVariantId,
                        Quantity = ici.Quantity
                    });
                }
            }
        }
    }
}

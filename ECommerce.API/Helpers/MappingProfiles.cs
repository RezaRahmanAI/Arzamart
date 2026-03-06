using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Enums;
using System.Linq;

namespace ECommerce.API.Helpers;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        // Safe mapping to prevent recursive Entity mapping crashes during DTO flattening
        CreateMap<Product, Product>().MaxDepth(1);
        CreateMap<ProductVariant, ProductVariant>().MaxDepth(1);
        CreateMap<Category, Category>().MaxDepth(1);
        
        CreateMap<Product, ProductDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : ""))
            .ForMember(d => d.SubCategoryName, o => o.MapFrom(s => s.SubCategory != null ? s.SubCategory.Name : null))
            .ForMember(d => d.CollectionName, o => o.MapFrom(s => s.Collection != null ? s.Collection.Name : null))
            .ForMember(d => d.Price, o => o.MapFrom(s => 
                s.Variants.Any(v => v.Price > 0) 
                    ? s.Variants.Where(v => v.Price > 0).Min(v => v.Price) ?? 0 
                    : (s.Variants.FirstOrDefault() != null ? s.Variants.FirstOrDefault().Price : 0)))
            .ForMember(d => d.CompareAtPrice, o => o.MapFrom(s => 
                s.Variants.Any(v => v.CompareAtPrice > 0)
                    ? s.Variants.Where(v => v.CompareAtPrice > 0).Min(v => v.CompareAtPrice) 
                    : (s.Variants.FirstOrDefault() != null ? s.Variants.FirstOrDefault().CompareAtPrice : null)))
            .ForMember(d => d.PurchaseRate, o => o.MapFrom(s => 
                s.Variants.Any(v => v.PurchaseRate != null && v.PurchaseRate > 0)
                    ? s.Variants.Where(v => v.PurchaseRate != null && v.PurchaseRate > 0).Min(v => v.PurchaseRate)
                    : null))
            .ForMember(d => d.Images, o => o.MapFrom(s => s.Images.Select(i => new ProductImageDto 
            {
                Id = i.Id,
                ImageUrl = i.Url,
                AltText = i.AltText,
                Label = i.Label,
                IsPrimary = i.IsMain,
                Type = i.MediaType ?? "image",
                Color = i.Color
            })))
            .ForMember(d => d.Variants, o => o.MapFrom(s => s.Variants.Select(v => new ProductVariantDto
            {
                Id = v.Id,
                Sku = v.Sku,
                Size = v.Size,
                Price = v.Price,
                CompareAtPrice = v.CompareAtPrice,
                PurchaseRate = v.PurchaseRate,
                StockQuantity = v.StockQuantity
            })))
            .ForMember(d => d.IsBundle, o => o.MapFrom(s => s.IsBundle))
            .ForMember(d => d.BundleQuantity, o => o.MapFrom(s => s.BundleQuantity));

        CreateMap<Product, ProductListDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : ""))
            .ForMember(d => d.Price, o => o.MapFrom(s => 
                s.Variants.Any(v => v.Price > 0) 
                    ? s.Variants.Where(v => v.Price > 0).Min(v => v.Price) ?? 0 
                    : (s.Variants.FirstOrDefault() != null ? s.Variants.FirstOrDefault().Price : 0)))
            .ForMember(d => d.CompareAtPrice, o => o.MapFrom(s => 
                s.Variants.Any(v => v.CompareAtPrice > 0)
                    ? s.Variants.Where(v => v.CompareAtPrice > 0).Min(v => v.CompareAtPrice) 
                    : (s.Variants.FirstOrDefault() != null ? s.Variants.FirstOrDefault().CompareAtPrice : null)))
            .ForMember(d => d.Variants, o => o.MapFrom(s => s.Variants.Select(v => new ProductVariantDto
            {
                Id = v.Id,
                Sku = v.Sku,
                Size = v.Size,
                Price = v.Price,
                CompareAtPrice = v.CompareAtPrice,
                PurchaseRate = v.PurchaseRate,
                StockQuantity = v.StockQuantity
            })));

        CreateMap<Category, CategoryDto>();
        CreateMap<SubCategory, SubCategoryDto>();
        CreateMap<Collection, CollectionDto>();
        
        CreateMap<Order, OrderDto>()
            .ForMember(d => d.ItemsCount, o => o.MapFrom(s => s.Items.Sum(i => i.Quantity)));

        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(d => d.ProductId, o => o.MapFrom(s => s.ProductId))
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.ProductName))
            .ForMember(d => d.UnitPrice, o => o.MapFrom(s => s.UnitPrice))
            .ForMember(d => d.Quantity, o => o.MapFrom(s => s.Quantity))
            .ForMember(d => d.Color, o => o.MapFrom(s => s.Color))
            .ForMember(d => d.Size, o => o.MapFrom(s => s.Size))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.ImageUrl))
            .ForMember(d => d.TotalPrice, o => o.MapFrom(s => s.UnitPrice * s.Quantity));

        CreateMap<Review, ReviewDto>()
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.Product != null ? s.Product.Name : ""));
        CreateMap<CreateReviewDto, Review>();
    }
}

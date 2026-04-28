using AutoMapper;
using ECommerce.Core.Constants;
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

        
        CreateMap<Product, ProductDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : ""))
            .ForMember(d => d.SubCategoryName, o => o.MapFrom(s => s.SubCategory != null ? s.SubCategory.Name : ""))
            .ForMember(d => d.CollectionName, o => o.MapFrom(s => s.Collection != null ? s.Collection.Name : null))
            .ForMember(d => d.StockQuantity, o => o.MapFrom(s => s.Variants.Any() ? s.Variants.Sum(v => v.StockQuantity) : s.StockQuantity))
            .ForMember(d => d.Price, o => o.MapFrom(s => 
                s.Variants.Any(v => v.Price > 0) 
                    ? s.Variants.Where(v => v.Price > 0).Min(v => v.Price) ?? 0 
                    : (s.Variants.FirstOrDefault() != null ? s.Variants.FirstOrDefault()!.Price ?? 0 : 0)))
            .ForMember(d => d.CompareAtPrice, o => o.MapFrom(s => 
                s.Variants.Any(v => v.Price > 0)
                    ? s.Variants.Where(v => v.Price > 0).Max(v => v.CompareAtPrice) 
                    : (s.Variants.FirstOrDefault() != null ? s.Variants.FirstOrDefault()!.CompareAtPrice ?? null : null)))
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
                Type = i.MediaType ?? "image"
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
            .ForMember(d => d.FabricAndCare, o => o.MapFrom(s => s.FabricAndCare))
            .ForMember(d => d.Description, o => o.MapFrom(s => s.Description))
            .ForMember(d => d.ShortDescription, o => o.MapFrom(s => s.ShortDescription))
            .ForMember(d => d.Tier, o => o.MapFrom(s => s.Tier))
            .ForMember(d => d.Tags, o => o.MapFrom(s => s.Tags))
            .ForMember(d => d.SortOrder, o => o.MapFrom(s => s.SortOrder))
            .ForMember(d => d.MetaTitle, o => o.MapFrom(s => s.MetaTitle))
            .ForMember(d => d.MetaDescription, o => o.MapFrom(s => s.MetaDescription));

        CreateMap<Product, ProductListDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : ""))
            .ForMember(d => d.Price, o => o.MapFrom(s => 
                s.Variants.Any(v => v.Price > 0) 
                    ? s.Variants.Where(v => v.Price > 0).Min(v => v.Price) ?? 0 
                    : (s.Variants.FirstOrDefault() != null ? s.Variants.FirstOrDefault()!.Price ?? 0 : 0)))
            .ForMember(d => d.CompareAtPrice, o => o.MapFrom(s => 
                s.Variants.Any(v => v.Price > 0)
                    ? s.Variants.Where(v => v.Price > 0).Max(v => v.CompareAtPrice) 
                    : (s.Variants.FirstOrDefault() != null ? s.Variants.FirstOrDefault()!.CompareAtPrice ?? null : null)))
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
            .ForMember(d => d.Images, o => o.MapFrom(s => s.Images.Select(i => new ProductImageDto 
            {
                Id = i.Id,
                ImageUrl = i.Url,
                AltText = i.AltText,
                Label = i.Label,
                IsPrimary = i.IsMain,
                Type = i.MediaType ?? "image"
            })))
            .ForMember(d => d.Tier, o => o.MapFrom(s => s.Tier))
            .ForMember(d => d.Tags, o => o.MapFrom(s => s.Tags))
            .ForMember(d => d.SortOrder, o => o.MapFrom(s => s.SortOrder))
            .ForMember(d => d.Description, o => o.MapFrom(s => s.Description))
            .ForMember(d => d.ShortDescription, o => o.MapFrom(s => s.ShortDescription))
            .ForMember(d => d.SubCategoryName, o => o.MapFrom(s => s.SubCategory != null ? s.SubCategory.Name : ""))
            .ForMember(d => d.CollectionName, o => o.MapFrom(s => s.Collection != null ? s.Collection.Name : null));


        CreateMap<Category, CategoryDto>();
        CreateMap<SubCategory, SubCategoryDto>();
        CreateMap<Collection, CollectionDto>();
        
        CreateMap<Order, OrderDto>()
            .ForMember(d => d.ItemsCount, o => o.MapFrom(s => s.Items.Sum(i => i.Quantity)))
            .ForMember(d => d.Items, o => o.MapFrom(s => s.Items))
            .ForMember(d => d.Logs, o => o.MapFrom(s => s.Logs.OrderByDescending(l => l.CreatedAt)))
            .ForMember(d => d.Notes, o => o.MapFrom(s => s.Notes.OrderByDescending(n => n.CreatedAt)))
            .ForMember(d => d.SourcePageName, o => o.MapFrom(s => s.SourcePage != null ? s.SourcePage.Name : null))
            .ForMember(d => d.SourcePageId, o => o.MapFrom(s => s.SourcePageId))
            .ForMember(d => d.SocialMediaSourceName, o => o.MapFrom(s => s.SocialMediaSource != null ? s.SocialMediaSource.Name : null))
            .ForMember(d => d.SocialMediaSourceId, o => o.MapFrom(s => s.SocialMediaSourceId));

        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(d => d.ProductId, o => o.MapFrom(s => s.ProductId))
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.ProductName))
            .ForMember(d => d.UnitPrice, o => o.MapFrom(s => s.UnitPrice))
            .ForMember(d => d.Quantity, o => o.MapFrom(s => s.Quantity))
            .ForMember(d => d.Size, o => o.MapFrom(s => s.Size))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.ImageUrl))
            .ForMember(d => d.TotalPrice, o => o.MapFrom(s => s.UnitPrice * s.Quantity));

        CreateMap<OrderLog, OrderLogDto>();
        CreateMap<OrderNote, OrderNoteDto>();

        CreateMap<Review, ReviewDto>()
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.Product != null ? s.Product.Name : ""));
        CreateMap<CreateReviewDto, Review>();

        CreateMap<SourcePage, SourcePageDto>();
        CreateMap<SocialMediaSource, SocialMediaSourceDto>();
        CreateMap<CustomLandingPageConfig, CustomLandingPageConfigDto>();
        CreateMap<CustomLandingPageConfigUpdateDto, CustomLandingPageConfig>();
    }
}

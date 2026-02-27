using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;

namespace ECommerce.Infrastructure.Helpers;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        // Product Mapping
        CreateMap<Product, ProductDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category.Name))
            .ForMember(d => d.SubCategoryName, o => o.MapFrom(s => s.SubCategory.Name))
            .ForMember(d => d.CollectionName, o => o.MapFrom(s => s.Collection.Name));

        CreateMap<ProductImage, ProductImageDto>()
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.Url))
            .ForMember(d => d.IsPrimary, o => o.MapFrom(s => s.IsMain))
            .ForMember(d => d.Type, o => o.MapFrom(s => s.MediaType));

        CreateMap<ProductVariant, ProductVariantDto>();

        CreateMap<Product, ProductListDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category.Name));

        // Order Mapping
        CreateMap<Order, OrderDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.ItemsCount, o => o.MapFrom(s => s.Items.Sum(x => x.Quantity)));

        CreateMap<OrderItem, OrderItemDto>();
        
        // Review Mapping
        CreateMap<Review, ReviewDto>()
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.Product != null ? s.Product.Name : "Unknown"));
        CreateMap<CreateReviewDto, Review>();
    }
}

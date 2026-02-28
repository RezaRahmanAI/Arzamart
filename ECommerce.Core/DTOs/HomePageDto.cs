using System.Collections.Generic;

namespace ECommerce.Core.DTOs;

public class HomePageDto
{
    public IEnumerable<HeroBannerDto> Banners { get; set; } = new List<HeroBannerDto>();
    public IEnumerable<ProductListDto> NewArrivals { get; set; } = new List<ProductListDto>();
    public IEnumerable<ProductListDto> FeaturedProducts { get; set; } = new List<ProductListDto>();
    public IEnumerable<CategoryDto> Categories { get; set; } = new List<CategoryDto>();
}

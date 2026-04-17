

namespace ECommerce.Core.DTOs;

public class CustomLandingPageConfigDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    
    public int? RelativeTimerTotalMinutes { get; set; }
    public bool IsTimerVisible { get; set; }
    public string? HeaderTitle { get; set; }
    public string? BannerTitle { get; set; }
    public string? BannerSubtitle { get; set; }

    public bool IsProductDetailsVisible { get; set; }
    public string? ProductDetailsTitle { get; set; }
    public bool IsFabricVisible { get; set; }
    public bool IsDesignVisible { get; set; }

    public bool IsTrustBannerVisible { get; set; }
    public string? TrustBannerText { get; set; }

    public string? FeaturedProductName { get; set; }
    public decimal? PromoPrice { get; set; }
    public decimal? OriginalPrice { get; set; }
}

public class CustomLandingPageConfigUpdateDto
{
    public int ProductId { get; set; }
    
    public int? RelativeTimerTotalMinutes { get; set; }
    public bool IsTimerVisible { get; set; }
    public string? HeaderTitle { get; set; }
    public string? BannerTitle { get; set; }
    public string? BannerSubtitle { get; set; }

    public bool IsProductDetailsVisible { get; set; }
    public string? ProductDetailsTitle { get; set; }
    public bool IsFabricVisible { get; set; }
    public bool IsDesignVisible { get; set; }

    public bool IsTrustBannerVisible { get; set; }
    public string? TrustBannerText { get; set; }

    public string? FeaturedProductName { get; set; }
    public decimal? PromoPrice { get; set; }
    public decimal? OriginalPrice { get; set; }
}

public class CustomLandingPageDataDto
{
    public ProductDto Product { get; set; } = null!;
    public CustomLandingPageConfigDto? Config { get; set; }
}

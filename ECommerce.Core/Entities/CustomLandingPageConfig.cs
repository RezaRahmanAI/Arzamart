using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Core.Entities;

public class CustomLandingPageConfig : BaseEntity
{
    public int ProductId { get; set; }
    public Product? Product { get; set; }

    // Header / Timer Section
    public int? RelativeTimerTotalMinutes { get; set; }
    public bool IsTimerVisible { get; set; } = true;
    public string? HeaderTitle { get; set; } // "অফারটি শেষ হতে মাত্র কিছুক্ষণ বাকি আছে!"

    // Product Details Section
    public bool IsProductDetailsVisible { get; set; } = true;
    public string? ProductDetailsTitle { get; set; } // "🔥 প্রোডাক্ট ডিটেইলস"
    public bool IsFabricVisible { get; set; } = true;
    public bool IsDesignVisible { get; set; } = true;

    // Trust Banner
    public bool IsTrustBannerVisible { get; set; } = true;
    public string? TrustBannerText { get; set; }
    public string? TrustBannerDescription { get; set; }

    // Configuration / Form Section
    public bool IsFeaturedOrderVisible { get; set; } = true;
    public string? FeaturedProductName { get; set; }
    public decimal? PromoPrice { get; set; }
    public decimal? OriginalPrice { get; set; }
}

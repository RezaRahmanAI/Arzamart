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
    public string? BannerTitle { get; set; } // "অফারটি মিস মানেই লস!!"
    public string? BannerSubtitle { get; set; } // "💥 ১৯৫০ টাকার হিজাব ছাড়া বোরখা অফারে পাচ্ছেন মাত্র ১১৫০ টাকায়!"

    // Product Details Section
    public bool IsProductDetailsVisible { get; set; } = true;
    public string? ProductDetailsTitle { get; set; } // "🔥 প্রোডাক্ট ডিটেইলস"
    public bool IsFabricVisible { get; set; } = true;
    public bool IsDesignVisible { get; set; } = true;

    // Trust Banner
    public bool IsTrustBannerVisible { get; set; } = true;
    public string? TrustBannerText { get; set; } // "দেখে চেক করে রিসিভ করতে পারবেন। পছন্দ না হলে ডেলিভারি চার্জ দিয়ে রিটার্ন করে দিতে পারবেন সহজেই"

    // Configuration / Form Section
    public string? FeaturedProductName { get; set; } // "The Signature Suit"
    public decimal? PromoPrice { get; set; }
    public decimal? OriginalPrice { get; set; }
}

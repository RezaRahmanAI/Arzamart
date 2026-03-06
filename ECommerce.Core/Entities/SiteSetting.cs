using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities;

public class SiteSetting : BaseEntity
{    
    [Required]
    [MaxLength(100)]
    public string WebsiteName { get; set; } = "ArzaMart";
    
    public string? LogoUrl { get; set; }
    
    [EmailAddress]
    public string? ContactEmail { get; set; }
    
    public string? ContactPhone { get; set; }
    
    public string? Address { get; set; }
    
    // Social Links
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? TwitterUrl { get; set; }
    public string? YoutubeUrl { get; set; }
    public string? WhatsAppNumber { get; set; }
    
    // Analytics & Retargeting
    public string? FacebookPixelId { get; set; }
    public string? GoogleTagId { get; set; }

    public string? Currency { get; set; } = "BDT";
    public decimal FreeShippingThreshold { get; set; } = 5000;
    public decimal ShippingCharge { get; set; } = 120;
    public string? SizeGuideImageUrl { get; set; }
}

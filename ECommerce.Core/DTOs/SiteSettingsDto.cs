using ECommerce.Core.Entities;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs;

public class SiteSettingsDto
{
    [Required]
    public string WebsiteName { get; set; } = string.Empty;
    
    public string? LogoUrl { get; set; }
    
    [EmailAddress]
    public string? ContactEmail { get; set; }
    
    public string? ContactPhone { get; set; }
    
    public string? Address { get; set; }
    
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? TwitterUrl { get; set; }
    public string? YoutubeUrl { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? Currency { get; set; }
    public decimal FreeShippingThreshold { get; set; }
    public decimal ShippingCharge { get; set; }
    public string? FacebookPixelId { get; set; }
    public string? GoogleTagId { get; set; }

    public IEnumerable<DeliveryMethod>? DeliveryMethods { get; set; }
}

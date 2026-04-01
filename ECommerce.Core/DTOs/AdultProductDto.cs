using System;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs;

public class AdultProductDto
{
    public int Id { get; set; }
    
    public string Headline { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Slug is required")]
    public string Slug { get; set; } = string.Empty;

    public string? Subtitle { get; set; }
    
    [Required(ErrorMessage = "Image URL is required")]
    public string ImgUrl { get; set; } = string.Empty;
    
    public string? BenefitsTitle { get; set; }
    public string? BenefitsContent { get; set; }
    
    public string? SideEffectsTitle { get; set; }
    public string? SideEffectsContent { get; set; }
    
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public bool IsActive { get; set; }
    public string? UsageTitle { get; set; }
    public string? UsageContent { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class AdultProductCreateUpdateDto
{
    public string Headline { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Slug is required")]
    public string Slug { get; set; } = string.Empty;

    public string? Subtitle { get; set; }
    
    [Required(ErrorMessage = "Image URL is required")]
    public string ImgUrl { get; set; } = string.Empty;
    
    public string? BenefitsTitle { get; set; }
    public string? BenefitsContent { get; set; }
    
    public string? SideEffectsTitle { get; set; }
    public string? SideEffectsContent { get; set; }
    
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public string? UsageTitle { get; set; }
    public string? UsageContent { get; set; }
}

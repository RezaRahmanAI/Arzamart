using System;

namespace ECommerce.Core.Entities;

public class AdultProduct : BaseEntity
{
    public string Headline { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
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

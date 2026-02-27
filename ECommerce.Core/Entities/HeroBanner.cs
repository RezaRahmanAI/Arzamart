using System;

namespace ECommerce.Core.Entities;

public class HeroBanner : BaseEntity
{
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string ImageUrl { get; set; }
    public string? MobileImageUrl { get; set; }
    public string? LinkUrl { get; set; }
    public string? ButtonText { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

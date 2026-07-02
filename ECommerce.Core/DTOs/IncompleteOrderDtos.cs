using System;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs;

public class IncompleteOrderAutosaveDto
{
    [Required]
    public string SessionId { get; set; } = string.Empty;

    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? ShippingAddress { get; set; }
    public string? City { get; set; }
    public string? Area { get; set; }

    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? SelectedSize { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal TotalPrice { get; set; }

    public string? LandingPageName { get; set; }
    public int? LandingPageId { get; set; }
    
    public string? ReferrerUrl { get; set; }
    public string? UtmSource { get; set; }
    public string? UtmCampaign { get; set; }
    public string? UtmAdset { get; set; }
    public string? UtmAd { get; set; }
    public string? Fbclid { get; set; }
    public string? DeviceType { get; set; }
    public string? Browser { get; set; }
}

public class IncompleteOrderStatsDto
{
    public int TodayIncompleteCount { get; set; }
    public int RecoveredCount { get; set; }
    public decimal RecoveryRate { get; set; }
    public string TopLandingPage { get; set; } = "N/A";
}

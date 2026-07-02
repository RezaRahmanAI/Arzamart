using System.ComponentModel.DataAnnotations;
using ECommerce.Core.Entities;
using ECommerce.Core.Enums;

namespace ECommerce.Core.DTOs;

public class OrderCreateDto
{
    [Required(ErrorMessage = "Customer name is required")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Shipping address is required")]
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public int ItemsCount { get; set; }
    public decimal Total { get; set; }
    public decimal Discount { get; set; }
    public decimal AdvancePayment { get; set; }
    public int? DeliveryMethodId { get; set; }
    public bool IsPreOrder { get; set; }
    public int? SourcePageId { get; set; }
    public int? SocialMediaSourceId { get; set; }
    public string? AdminNote { get; set; }
    public string? CustomerNote { get; set; }

    [Required(ErrorMessage = "Order must contain at least one item")]
    [MinLength(1, ErrorMessage = "Order must contain at least one item")]
    [MaxLength(100, ErrorMessage = "Order cannot contain more than 100 items")]
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public int ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? TotalPrice { get; set; }
    public string? Size { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsStockAvailable { get; set; }
}

public class OrderDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal Tax { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal Discount { get; set; }
    public decimal AdvancePayment { get; set; }
    public decimal Total { get; set; }
    public int ItemsCount { get; set; }
    public int? DeliveryMethodId { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsPreOrder { get; set; }
    public bool IsStockAvailable { get; set; }
    public string? CustomerNote { get; set; }
    public int? SourcePageId { get; set; }
    public string? SourcePageName { get; set; }
    public int? SocialMediaSourceId { get; set; }
    public string? SocialMediaSourceName { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public List<OrderLogDto> Logs { get; set; } = new();
    public List<OrderNoteDto> Notes { get; set; } = new();

    public string? SessionId { get; set; }
    public string? ReferrerUrl { get; set; }
    public string? UtmSource { get; set; }
    public string? UtmCampaign { get; set; }
    public string? UtmAdset { get; set; }
    public string? UtmAd { get; set; }
    public string? Fbclid { get; set; }
    public string? DeviceType { get; set; }
    public string? Browser { get; set; }
}

public class OrderLogDto
{
    public int Id { get; set; }
    public string StatusFrom { get; set; } = string.Empty;
    public string StatusTo { get; set; } = string.Empty;
    public string? ChangedBy { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OrderNoteDto
{
    public int Id { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

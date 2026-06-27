using System;
using System.Collections.Generic;
using ECommerce.Core.Enums;

namespace ECommerce.Core.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;
    // NOTE: CustomerPhone is a flat string (no FK to Customer) by design.
    // Orders can be placed by non-registered users, so a FK is not enforced here.
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

    public int? DeliveryMethodId { get; set; }
    public DeliveryMethod? DeliveryMethod { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    public string? CreatedIp { get; set; }
    public bool IsPreOrder { get; set; }
    public string? AdminNote { get; set; }
    public string? CustomerNote { get; set; }
    public int? SourcePageId { get; set; }
    public SourcePage? SourcePage { get; set; }

    public int? SocialMediaSourceId { get; set; }
    public SocialMediaSource? SocialMediaSource { get; set; }

    public ICollection<OrderLog> Logs { get; set; } = new List<OrderLog>();
    public ICollection<OrderNote> Notes { get; set; } = new List<OrderNote>();
}

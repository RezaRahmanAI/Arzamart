using System;
using System.Collections.Generic;

namespace ECommerce.Core.Entities;

public enum OrderStatus
{
    Pending,
    Confirmed,
    Processing,
    Packed,
    Shipped,
    Delivered,
    Cancelled,
    PreOrder,
    Hold,
    Return,
    Exchange,
    ReturnProcess,
    Refund
}

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty; // e.g. ORD-2024-001
    
    // Customer Info (Snapshot)
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    
    // Financials
    public decimal SubTotal { get; set; }
    public decimal Tax { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal Total { get; set; }
    
    public int? DeliveryMethodId { get; set; }
    public DeliveryMethod? DeliveryMethod { get; set; }
    
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    
    public long? SteadfastConsignmentId { get; set; }
    public string? SteadfastTrackingCode { get; set; }
    public string? SteadfastStatus { get; set; }
    public string? CreatedIp { get; set; }
    public bool IsPreOrder { get; set; }
    public string? AdminNote { get; set; }
    public int? SourcePageId { get; set; }
    public SourcePage? SourcePage { get; set; }

    public int? SocialMediaSourceId { get; set; }
    public SocialMediaSource? SocialMediaSource { get; set; }

    public ICollection<OrderLog> Logs { get; set; } = new List<OrderLog>();
    public ICollection<OrderNote> Notes { get; set; } = new List<OrderNote>();
}


public class OrderNote : BaseEntity
{
    public int OrderId { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}


public class OrderLog : BaseEntity
{
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public string StatusFrom { get; set; } = string.Empty;
    public string StatusTo { get; set; } = string.Empty;
    public string? ChangedBy { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}


public class OrderItem : BaseEntity
{
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    
    public string ProductName { get; set; } = string.Empty;
    public string? Size { get; set; }
    public string? ImageUrl { get; set; } // Snapshot of product image
    
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice => UnitPrice * Quantity;
}

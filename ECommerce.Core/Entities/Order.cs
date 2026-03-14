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
    Cancelled
}

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } // e.g. ORD-2024-001
    
    // Customer Info (Snapshot)
    public string CustomerName { get; set; }
    public string CustomerPhone { get; set; }
    public string ShippingAddress { get; set; }
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
}


public class OrderItem : BaseEntity
{
    public int OrderId { get; set; }
    public Order Order { get; set; }
    
    public int ProductId { get; set; }
    public Product Product { get; set; }
    
    public string ProductName { get; set; }
    public string? Color { get; set; }
    public string? Size { get; set; }
    public string? ImageUrl { get; set; } // Snapshot of product image
    
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice => UnitPrice * Quantity;
}

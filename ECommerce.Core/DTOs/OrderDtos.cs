using ECommerce.Core.Entities;

namespace ECommerce.Core.DTOs;

public class OrderCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public int ItemsCount { get; set; }
    public decimal Total { get; set; }
    public int? DeliveryMethodId { get; set; }
    public bool IsPreOrder { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public int ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? TotalPrice { get; set; }
    public string? Color { get; set; }
    public string? Size { get; set; }
    public string? ImageUrl { get; set; }
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
    public decimal Total { get; set; }
    public int ItemsCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsPreOrder { get; set; }
    public string? AdminNote { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public List<OrderLogDto> Logs { get; set; } = new();
    public List<OrderNoteDto> Notes { get; set; } = new();
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

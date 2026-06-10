using System;

namespace ECommerce.Core.Entities;

public class OrderLog : BaseEntity
{
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public string StatusFrom { get; set; } = string.Empty;
    public string StatusTo { get; set; } = string.Empty;
    public string? ChangedBy { get; set; }
    public string? Note { get; set; }
}

using System;

namespace ECommerce.Core.Entities;

public class OrderNote : BaseEntity
{
    public int OrderId { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

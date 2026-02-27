using System.Collections.Generic;

namespace ECommerce.Core.Entities;

public class Cart : BaseEntity
{
    public string? UserId { get; set; } // For logged in users (matches ApplicationUser.Id which is string)
    public string? SessionId { get; set; } // For anonymous users (X-Session-Id)
    public string? GuestId { get; set; } // Deprecated, keeping but prioritizing SessionId 

    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}

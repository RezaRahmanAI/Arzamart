using System.ComponentModel.DataAnnotations;
// Force rebuild

namespace ECommerce.Core.Entities;

public class BlockedIp
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string IpAddress { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string? Reason { get; set; }
    
    public DateTime BlockedAt { get; set; } = DateTime.UtcNow;
    
    public string? BlockedBy { get; set; } // Username of the admin who blocked it
}

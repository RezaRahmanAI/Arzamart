using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Core.Entities;

public class AdminActivityLog
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [ForeignKey(nameof(UserId))]
    public virtual ApplicationUser? User { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;  // "Login", "PasswordReset", "PasswordViewed", "StatusChanged", "AccountCreated", "PermissionsUpdated", "AccountUpdated"
    
    [MaxLength(500)]
    public string? Details { get; set; }
    
    [MaxLength(50)]
    public string? IpAddress { get; set; }
    
    public string? PerformedByUserId { get; set; }
    
    [ForeignKey(nameof(PerformedByUserId))]
    public virtual ApplicationUser? PerformedBy { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

using System;

namespace ECommerce.Core.Entities;

public class StaffAuditLog
{
    public Guid Id { get; set; }
    public Guid? ActorId { get; set; }
    public string Action { get; set; } = string.Empty;  // "CREATE_STAFF", "RESET_PASSWORD", "CHANGE_ROLE", etc.
    public Guid? TargetStaffId { get; set; }
    public string? Details { get; set; } // stored as JSON string in SQL Server
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual StaffUser? Actor { get; set; }
    public virtual StaffUser? TargetStaff { get; set; }
}

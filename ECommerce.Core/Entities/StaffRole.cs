using System;
using System.Collections.Generic;

namespace ECommerce.Core.Entities;

public class StaffRole
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSystemRole { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<StaffRolePermission> RolePermissions { get; set; } = new List<StaffRolePermission>();
    public virtual ICollection<StaffUser> StaffUsers { get; set; } = new List<StaffUser>();
}

using System;

namespace ECommerce.Core.Entities;

public class StaffRolePermission
{
    public Guid RoleId { get; set; }
    public Guid PermissionId { get; set; }

    public virtual StaffRole Role { get; set; } = null!;
    public virtual StaffPermission Permission { get; set; } = null!;
}

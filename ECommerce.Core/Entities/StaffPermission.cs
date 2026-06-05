using System;
using System.Collections.Generic;

namespace ECommerce.Core.Entities;

public class StaffPermission
{
    public Guid Id { get; set; }
    public Guid ModuleId { get; set; }
    public string Action { get; set; } = string.Empty; // "view", "create", "edit", "delete", "export"

    public virtual StaffModule Module { get; set; } = null!;
    public virtual ICollection<StaffRolePermission> RolePermissions { get; set; } = new List<StaffRolePermission>();
}

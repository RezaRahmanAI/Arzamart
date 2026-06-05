using System;
using System.Collections.Generic;

namespace ECommerce.Core.Entities;

public class StaffModule
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }

    public virtual ICollection<StaffPermission> Permissions { get; set; } = new List<StaffPermission>();
}

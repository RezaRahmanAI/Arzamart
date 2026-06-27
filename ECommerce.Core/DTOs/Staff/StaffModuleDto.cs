namespace ECommerce.Core.DTOs.Staff;

public class StaffModuleDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<StaffModulePermissionDto> Permissions { get; set; } = new();
}

public class StaffModulePermissionDto
{
    public string Id { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
}

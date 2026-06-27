namespace ECommerce.Core.DTOs.Staff;

public class StaffAuditLogDto
{
    public string Id { get; set; } = string.Empty;
    public string? ActorId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string ActorUsername { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? TargetStaffId { get; set; }
    public string? TargetStaffName { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StaffAuditLogListResultDto
{
    public List<StaffAuditLogDto> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
}

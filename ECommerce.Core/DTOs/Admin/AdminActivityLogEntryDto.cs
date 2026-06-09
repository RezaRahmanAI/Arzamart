namespace ECommerce.Core.DTOs.Admin;

public class AdminActivityLogEntryDto
{
    public int Id { get; set; }
    public string? Action { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? PerformedByName { get; set; }
}

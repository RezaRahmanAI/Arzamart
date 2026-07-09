namespace ECommerce.Core.DTOs.Location;

public class DeliveryZoneDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public List<int> UpazilaIds { get; set; } = new();
}

public class DeliveryZoneListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public int UpazilaCount { get; set; }
}

namespace ECommerce.Core.DTOs.Admin;

public class AdminCustomerListItemDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public bool IsSuspicious { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

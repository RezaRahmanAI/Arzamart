namespace ECommerce.Core.DTOs;

public class CustomerDto
{
    public int Id { get; set; }
    public string Phone { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public class CustomerProfileRequest
{
    public string Phone { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
}

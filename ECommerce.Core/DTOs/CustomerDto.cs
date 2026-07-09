namespace ECommerce.Core.DTOs;

public class CustomerDto
{
    public int Id { get; set; }
    public string Phone { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string? City { get; set; }
    public string? Area { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? DivisionId { get; set; }
    public string? DivisionName { get; set; }
    public int? DistrictId { get; set; }
    public string? DistrictName { get; set; }
    public int? UpazilaId { get; set; }
    public string? UpazilaName { get; set; }
}

public class CustomerProfileRequest
{
    public string Phone { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string? City { get; set; }
    public string? Area { get; set; }
    public int? DivisionId { get; set; }
    public int? DistrictId { get; set; }
    public int? UpazilaId { get; set; }
}

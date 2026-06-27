using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs.Admin;

public class BlockedIpDto
{
    public int Id { get; set; }

    [Required]
    [MaxLength(45)]
    public string IpAddress { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Reason { get; set; }

    public DateTime BlockedAt { get; set; }

    [MaxLength(100)]
    public string? BlockedBy { get; set; }
}

public class BlockIpRequestDto
{
    [Required]
    [MaxLength(45)]
    public string IpAddress { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Reason { get; set; }
}

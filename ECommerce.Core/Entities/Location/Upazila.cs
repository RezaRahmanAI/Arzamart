using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities.Location;

public class Upazila : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string NameEn { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string NameBn { get; set; } = string.Empty;

    [MaxLength(10)]
    public string? BdGovtCode { get; set; }

    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public int DistrictId { get; set; }
    public District District { get; set; } = null!;
}

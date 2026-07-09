using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities.Location;

public class District : BaseEntity
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

    public int DivisionId { get; set; }
    public Division Division { get; set; } = null!;

    public ICollection<Upazila> Upazilas { get; set; } = new List<Upazila>();
}

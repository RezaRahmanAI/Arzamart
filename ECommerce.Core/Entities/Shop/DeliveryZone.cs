using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities.Shop;

public class DeliveryZone : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<DeliveryZoneUpazila> DeliveryZoneUpazilas { get; set; } = new List<DeliveryZoneUpazila>();
}

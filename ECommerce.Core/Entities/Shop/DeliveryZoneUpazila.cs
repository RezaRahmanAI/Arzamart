namespace ECommerce.Core.Entities.Shop;

public class DeliveryZoneUpazila : BaseEntity
{
    public int DeliveryZoneId { get; set; }
    public DeliveryZone DeliveryZone { get; set; } = null!;

    public int UpazilaId { get; set; }
    public Location.Upazila Upazila { get; set; } = null!;
}

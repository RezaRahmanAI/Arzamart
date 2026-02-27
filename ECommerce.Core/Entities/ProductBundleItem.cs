namespace ECommerce.Core.Entities;

public class ProductBundleItem : BaseEntity
{
    // The Main Product (of type 'Combo')
    public int MainProductId { get; set; }
    public Product MainProduct { get; set; } = null!;

    // The component product
    public int ComponentProductId { get; set; }
    public Product ComponentProduct { get; set; } = null!;

    // Optional: specific variant selection for the bundle
    public int? ComponentVariantId { get; set; }
    public ProductVariant? ComponentVariant { get; set; }

    public int Quantity { get; set; } = 1;
}

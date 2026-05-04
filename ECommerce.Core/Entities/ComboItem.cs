using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Core.Entities;

public class ComboItem : BaseEntity
{
    public int ComboProductId { get; set; }
    public Product? ComboProduct { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public int? ProductVariantId { get; set; }
    public ProductVariant? ProductVariant { get; set; }

    public int Quantity { get; set; } = 1;
}

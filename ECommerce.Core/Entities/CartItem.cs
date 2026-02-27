namespace ECommerce.Core.Entities;

public class CartItem : BaseEntity
{
    public int CartId { get; set; }
    public Cart Cart { get; set; }

    public int ProductId { get; set; }
    public Product Product { get; set; }

    public int Quantity { get; set; }
    public string Color { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
}

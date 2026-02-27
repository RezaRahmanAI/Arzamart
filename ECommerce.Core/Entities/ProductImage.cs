namespace ECommerce.Core.Entities;

public class ProductImage : BaseEntity
{
    public string Url { get; set; }
    public string? AltText { get; set; } // Alt text for SEO
    public string? Label { get; set; } // Caption/Title e.g. "Front View"
    public string MediaType { get; set; } = "image"; // image, video
    public bool IsMain { get; set; }
    public int DisplayOrder { get; set; }
    public string? Color { get; set; }
    
    public int ProductId { get; set; }
    public Product Product { get; set; }
}

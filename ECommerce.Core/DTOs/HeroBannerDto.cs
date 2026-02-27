namespace ECommerce.Core.DTOs;

public class HeroBannerDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Subtitle { get; set; }
    public string ImageUrl { get; set; }
    public string MobileImageUrl { get; set; }
    public string LinkUrl { get; set; }
    public string ButtonText { get; set; }
    public int DisplayOrder { get; set; }
}

public class CreateHeroBannerDto
{
    public string Title { get; set; }
    public string Subtitle { get; set; }
    public string ImageUrl { get; set; }
    public string MobileImageUrl { get; set; }
    public string LinkUrl { get; set; }
    public string ButtonText { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

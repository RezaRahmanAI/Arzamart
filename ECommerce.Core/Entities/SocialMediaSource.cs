namespace ECommerce.Core.Entities;

public class SocialMediaSource : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

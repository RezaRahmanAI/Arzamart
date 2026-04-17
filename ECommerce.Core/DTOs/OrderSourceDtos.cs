namespace ECommerce.Core.DTOs;

public class SourcePageDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class SourcePageCreateDto
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class SocialMediaSourceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class SocialMediaSourceCreateDto
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

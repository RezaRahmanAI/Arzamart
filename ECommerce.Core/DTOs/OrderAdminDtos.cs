namespace ECommerce.Core.DTOs;

public class OrderQueryDto
{
    public string? SearchTerm { get; set; }
    public string? Status { get; set; }
    public string? DateRange { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool PreOrderOnly { get; set; }
    public bool WebsiteOnly { get; set; }
    public bool ManualOnly { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int? SourcePageId { get; set; }
    public int? SocialMediaSourceId { get; set; }
    public string? CustomerPhone { get; set; }
    public int? ProductId { get; set; }
    public string? OrderNumber { get; set; }
}

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class AddNoteDto
{
    public string Note { get; set; } = string.Empty;
}

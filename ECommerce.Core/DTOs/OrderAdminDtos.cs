namespace ECommerce.Core.DTOs;

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class AddNoteDto
{
    public string Note { get; set; } = string.Empty;
}

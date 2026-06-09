namespace ECommerce.Core.DTOs.Analytics;

public class DailyTrafficDto
{
    public DateOnly Date { get; set; }
    public int PageViews { get; set; }
    public int UniqueVisitors { get; set; }
}

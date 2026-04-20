namespace ECommerce.Core.DTOs;

public class OrderStatsDto
{
    public int TotalOrders { get; set; }
    public int Processing { get; set; }
    public decimal TotalRevenue { get; set; }
    public int RefundRequests { get; set; }
}

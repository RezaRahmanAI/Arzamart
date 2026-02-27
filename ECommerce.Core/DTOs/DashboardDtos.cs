namespace ECommerce.Core.DTOs;

public class DashboardStatsDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int DeliveredOrders { get; set; }
    public int PendingOrders { get; set; }
    public int ReturnedOrders { get; set; }
    public int CustomerQueries { get; set; }
    public decimal TotalPurchaseCost { get; set; }
    public decimal AverageSellingPrice { get; set; }
    public decimal ReturnValue { get; set; }
    public string ReturnRate { get; set; } = "0%";
    public int TotalProducts { get; set; }
    public int TotalCustomers { get; set; }
}


public class RecentOrderDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
}

public class PopularProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int SoldCount { get; set; }
    public int Stock { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
}

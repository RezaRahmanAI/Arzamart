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

    // Today's Row Cards
    public int TodayOrdersCount { get; set; }
    public decimal TodayOrdersRevenue { get; set; }

    public int TodayPendingCount { get; set; }
    public decimal TodayPendingRevenue { get; set; }

    public int TodayConfirmCount { get; set; }
    public decimal TodayConfirmRevenue { get; set; }

    public int TodayPackagingCount { get; set; }
    public decimal TodayPackagingRevenue { get; set; }

    public int TodayShippedCount { get; set; }
    public decimal TodayShippedRevenue { get; set; }

    public int TodayPreOrdersCount { get; set; }
    public decimal TodayPreOrdersRevenue { get; set; }

    public int WapaShopCount { get; set; }
    public decimal WapaShopRevenue { get; set; }

    public int MirpurShopCount { get; set; }
    public decimal MirpurShopRevenue { get; set; }

    public int PathaoReturnCount { get; set; }
    public decimal PathaoReturnRevenue { get; set; }

    public int PathaoDeliveredCount { get; set; }
    public decimal PathaoDeliveredRevenue { get; set; }

    // Total Statistics Row Cards
    public int TotalPendingCount { get; set; }
    public decimal TotalPendingRevenue { get; set; }

    public int TotalConfirmCount { get; set; }
    public decimal TotalConfirmRevenue { get; set; }

    public int TotalPackagingCount { get; set; }
    public decimal TotalPackagingRevenue { get; set; }

    public int TotalReturnProcessCount { get; set; }
    public decimal TotalReturnProcessRevenue { get; set; }

    public int TotalShippedCount { get; set; }
    public decimal TotalShippedRevenue { get; set; }

    public int TotalPreOrdersCount { get; set; }
    public decimal TotalPreOrdersRevenue { get; set; }

    public int IncompleteOrdersCount { get; set; }
    public decimal IncompleteOrdersRevenue { get; set; }
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

public class CategorySalesDto
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

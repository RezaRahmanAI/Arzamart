using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/analytics")]
[Authorize(Roles = "Admin")]
public class AdminAnalyticsController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public AdminAnalyticsController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("sales")]
    public async Task<ActionResult<List<SalesDataDto>>> GetSalesData([FromQuery] string period = "month")
    {
        var data = await _dashboardService.GetSalesDataAsync(period);
        return Ok(data);
    }

    [HttpGet("orders/distribution")]
    public async Task<ActionResult<List<StatusDistributionDto>>> GetOrderStatusDistribution()
    {
        var data = await _dashboardService.GetOrderStatusDistributionAsync();
        return Ok(data);
    }

    [HttpGet("customers/growth")]
    public async Task<ActionResult<List<CustomerGrowthDto>>> GetCustomerGrowth()
    {
        var data = await _dashboardService.GetCustomerGrowthAsync();
        return Ok(data);
    }
    
    [HttpGet("products/top")]
    public async Task<ActionResult<List<PopularProductDto>>> GetTopProducts()
    {
        // Reusing the existing method for now, could be specialized later
        var data = await _dashboardService.GetPopularProductsAsync();
        return Ok(data);
    }
}

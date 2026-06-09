using ECommerce.Core.Constants;
using ECommerce.Core.Interfaces;

namespace ECommerce.Infrastructure.Services;

public class OrderNumberGenerator : IOrderNumberGenerator
{
    public string Generate(int orderId)
    {
        return (orderId + AppConstants.OrderNumberBase).ToString();
    }
}
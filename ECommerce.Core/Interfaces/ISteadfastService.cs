using System.Threading.Tasks;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces;

public interface ISteadfastService
{
    Task<(string? ConsignmentId, string? TrackingCode)> CreateOrderAsync(Order order);
}

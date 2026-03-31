using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.Services;

public class SteadfastWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SteadfastWorker> _logger;
    private readonly PeriodicTimer _timer;

    public SteadfastWorker(IServiceProvider serviceProvider, ILogger<SteadfastWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SteadfastWorker started.");

        do
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                var steadfastService = scope.ServiceProvider.GetRequiredService<ISteadfastService>();

                var spec = new BaseSpecification<Order>(o => 
                    o.Status == OrderStatus.Confirmed && 
                    o.SteadfastConsignmentId == null);
                
                var orders = await unitOfWork.Repository<Order>().ListAsync(spec);

                if (orders.Any())
                {
                    _logger.LogInformation($"Found {orders.Count} orders to send to Steadfast.");
                    
                    foreach (var order in orders)
                    {
                        try
                        {
                            var (consignmentId, trackingCode) = await steadfastService.CreateOrderAsync(order);
                            if (!string.IsNullOrEmpty(consignmentId))
                            {
                                if (long.TryParse(consignmentId, out var cid))
                                {
                                    order.SteadfastConsignmentId = cid;
                                }
                                order.SteadfastTrackingCode = trackingCode;
                                order.SteadfastStatus = "in_review";
                                
                                unitOfWork.Repository<Order>().Update(order);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error processing order {order.Id} in SteadfastWorker.");
                        }
                    }

                    await unitOfWork.Complete();
                    _logger.LogInformation("Finished processing Steadfast orders.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SteadfastWorker execution loop.");
            }
        } while (await _timer.WaitForNextTickAsync(stoppingToken) && !stoppingToken.IsCancellationRequested);
        
        _logger.LogInformation("SteadfastWorker stopping.");
    }
}

using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.Cache;

/// <summary>
/// Background service that periodically checks if AppCache is stale
/// (older than MaxCacheAge) and triggers a warmup rebuild.
/// Runs every 5 minutes.
/// </summary>
public class CacheHealthCheckService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly AppCache _cache;
    private readonly ILogger<CacheHealthCheckService> _logger;
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(5);

    public CacheHealthCheckService(
        IServiceScopeFactory scopeFactory,
        AppCache cache,
        ILogger<CacheHealthCheckService> logger)
    {
        _scopeFactory = scopeFactory;
        _cache = cache;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(CheckInterval, stoppingToken);

            if (!_cache.IsStale)
                continue;

            _logger.LogWarning(
                "[CacheHealth] Cache is stale (last warmup: {LastWarmup}). Triggering rebuild...",
                _cache.LastWarmupTime?.ToString("o") ?? "never");

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var warmup = scope.ServiceProvider
                    .GetRequiredService<CacheWarmupService>();
                await warmup.StartAsync(stoppingToken);
                _logger.LogInformation("[CacheHealth] Cache rebuild complete.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[CacheHealth] Cache rebuild failed.");
            }
        }
    }
}

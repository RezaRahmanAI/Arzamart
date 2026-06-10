using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Cache;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.Tracking;

public class VisitorTrackingWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly AppCache _appCache;
    private readonly ILogger<VisitorTrackingWorker> _logger;
    private long _pageViews;
    private long _uniqueVisitors;

    public VisitorTrackingWorker(IServiceScopeFactory scopeFactory, AppCache appCache, ILogger<VisitorTrackingWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _appCache = appCache;
        _logger = logger;
    }

    public void TrackVisit(bool isNewVisitor)
    {
        Interlocked.Increment(ref _pageViews);
        if (isNewVisitor)
            Interlocked.Increment(ref _uniqueVisitors);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await FlushAsync();
        }

        // Final flush on shutdown
        await FlushAsync();
    }

    private async Task FlushAsync()
    {
        // Always clean expired security flags
        _appCache.CleanExpiredSecurityFlags();

        var pv = Interlocked.Exchange(ref _pageViews, 0);
        var uv = Interlocked.Exchange(ref _uniqueVisitors, 0);

        if (pv == 0 && uv == 0) return;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var affected = await db.DailyTraffics
                .Where(t => t.Date == today)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(t => t.PageViews, t => t.PageViews + pv)
                    .SetProperty(t => t.UniqueVisitors, t => t.UniqueVisitors + uv));

            if (affected == 0)
            {
                db.DailyTraffics.Add(new DailyTraffic
                {
                    Date = today,
                    PageViews = (int)pv,
                    UniqueVisitors = (int)uv
                });
                await db.SaveChangesAsync();
            }

            _logger.LogDebug("Flushed visitor stats: {PageViews} views, {UniqueVisitors} unique", pv, uv);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Visitor tracking flush failed silently");
        }
    }
}

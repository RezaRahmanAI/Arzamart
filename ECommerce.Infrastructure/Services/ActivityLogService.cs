using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly IUnitOfWork _unitOfWork;

    public ActivityLogService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task LogAsync(string userId, string action, string? details, string? ipAddress, string? performedByUserId)
    {
        var log = new AdminActivityLog
        {
            UserId = userId,
            Action = action,
            Details = details,
            IpAddress = ipAddress,
            PerformedByUserId = performedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _unitOfWork.Repository<AdminActivityLog>().Add(log);
        await _unitOfWork.Complete();
    }

    public async Task<List<AdminActivityLog>> GetRecentLogsAsync(string userId, int take = 50)
    {
        return await _unitOfWork.Repository<AdminActivityLog>()
            .GetQueryable()
            .Where(l => l.UserId == userId)
            .Include(l => l.PerformedBy)
            .OrderByDescending(l => l.CreatedAt)
            .Take(take)
            .ToListAsync();
    }
}

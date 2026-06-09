using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces;

public interface IActivityLogService
{
    Task LogAsync(string userId, string action, string? details, string? ipAddress, string? performedByUserId);
    Task<List<AdminActivityLog>> GetRecentLogsAsync(string userId, int take = 50);
}

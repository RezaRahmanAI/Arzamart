using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Admin;

namespace ECommerce.Core.Interfaces;

public interface IAdminUserService
{
    Task<List<AdminUserItemDto>> GetAllAsync();
    Task<(bool Success, string Message, AdminUserItemDto? User)> CreateAsync(CreateAdminUserDto dto, string performedByUserId, string? ipAddress);
    Task<(bool Success, string Message)> UpdateAsync(string id, UpdateAdminUserDto dto, string performedByUserId, string? ipAddress);
    Task<(bool Success, string Message)> ResetPasswordAsync(string id, ResetPasswordDto dto, string performedByUserId, string? ipAddress);
    Task<(bool Success, UserStatusChangeResultDto Result)> ToggleActiveAsync(string id, string currentUserId);
    Task<List<AdminActivityLogEntryDto>> GetActivityLogAsync(string id);
}

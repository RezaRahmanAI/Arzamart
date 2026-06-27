using ECommerce.Core.DTOs.Staff;

namespace ECommerce.Core.Interfaces;

public interface IStaffService
{
    // Staff Users
    Task<StaffUserListResultDto> GetStaffUsersAsync(string? search, string? roleId, bool? isActive, int page, int pageSize);
    Task<StaffUserDto?> GetStaffUserAsync(string id);
    Task<(bool Success, string Message, StaffUserDto? User)> CreateStaffAsync(CreateStaffDto dto, string performedByUserId, string? ipAddress);
    Task<(bool Success, string Message)> UpdateStaffAsync(string id, UpdateStaffDto dto, string performedByUserId, string? ipAddress);
    Task<(bool Success, string Message)> ToggleStaffStatusAsync(string id, bool isActive, string currentUserId);
    Task<(bool Success, string Message)> DeleteStaffAsync(string id, string performedByUserId, string? ipAddress);
    Task<(bool Success, string Message)> ResetPasswordAsync(string id, string newPassword, string performedByUserId, string? ipAddress);

    // Roles
    Task<List<StaffRoleDto>> GetRolesAsync();
    Task<(bool Success, string Message, string? Id)> CreateRoleAsync(CreateRoleDto dto);
    Task<(bool Success, string Message)> UpdateRoleAsync(string id, UpdateRoleDto dto);
    Task<(bool Success, string Message)> DeleteRoleAsync(string id);
    Task<List<string>> GetRolePermissionsAsync(string roleId);
    Task<(bool Success, string Message)> UpdateRolePermissionsAsync(string roleId, List<string> permissionIds);

    // Modules
    Task<List<StaffModuleDto>> GetModulesAsync();

    // Audit Logs
    Task<StaffAuditLogListResultDto> GetAuditLogsAsync(string? actorId, string? action, DateTime? startDate, DateTime? endDate, int page, int pageSize);
}

using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IProfileService
{
    Task<ProfileResponseDto?> GetProfileAsync(string userId);
    Task<(bool Success, string? Error)> UpdateProfileAsync(string userId, UpdateProfileDto dto);
    Task<(bool Success, IEnumerable<string> Errors)> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
}

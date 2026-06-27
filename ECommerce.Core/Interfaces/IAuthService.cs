using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Auth;

namespace ECommerce.Core.Interfaces
{
    public interface IAuthService
    {
        Task<(LoginResponseDto Response, string RefreshToken)> LoginAsync(LoginDto loginDto, string deviceInfo, string ipAddress);
        Task<(LoginResponseDto Response, string RefreshToken)> CustomerLoginAsync(string phone, string deviceInfo, string ipAddress);
        Task<(AuthResponseDto Response, string RefreshToken)> RefreshTokenAsync(string refreshToken, string expiredAccessToken, string deviceInfo, string ipAddress);
        Task<UserDto> GetCurrentUserAsync(string userId);
        Task RevokeTokenAsync(string refreshToken);
        Task LogoutAsync(string userId, string refreshToken);
        Task<(AdminAuthResponseDto Response, string RefreshToken)> AdminLoginAsync(string identifier, string password, string ipAddress);
        Task<UserSummaryDto?> GetUserSummaryAsync(string userId);
        Task AdminLogoutAsync(string userId);
        Task<(AdminAuthResponseDto Response, string RefreshToken)> RefreshAdminTokenAsync(string refreshToken, string ipAddress);
        Task ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    }
}

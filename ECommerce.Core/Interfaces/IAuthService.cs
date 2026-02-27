using System.Threading.Tasks;
using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces
{
    public interface IAuthService
    {
        Task<(LoginResponseDto Response, string RefreshToken)> LoginAsync(LoginDto loginDto, string deviceInfo, string ipAddress);
        Task<(LoginResponseDto Response, string RefreshToken)> CustomerLoginAsync(string phone, string deviceInfo, string ipAddress);
        Task<(AuthResponseDto Response, string RefreshToken)> RefreshTokenAsync(string refreshToken, string expiredAccessToken, string deviceInfo, string ipAddress);
        Task RevokeTokenAsync(string refreshToken);
        Task LogoutAsync(string userId, string refreshToken);
    }
}

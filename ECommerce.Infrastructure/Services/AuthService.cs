using System;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;
        private readonly IMemoryCache _cache;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            IJwtTokenService jwtTokenService,
            IUnitOfWork unitOfWork,
            IConfiguration config,
            IMemoryCache cache)
        {
            _userManager = userManager;
            _jwtTokenService = jwtTokenService;
            _unitOfWork = unitOfWork;
            _config = config;
            _cache = cache;
        }

        public async Task<(LoginResponseDto Response, string RefreshToken)> LoginAsync(LoginDto loginDto, string deviceInfo, string ipAddress)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);

            if (user == null)
            {
                throw new Exception("INVALID_CREDENTIALS");
            }

            bool passwordValid = false;

            // 1. Try BCrypt (New Format)
            try
            {
                if (BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                {
                    passwordValid = true;
                }
            }
            catch
            {
                // Not a BCrypt hash
            }

            // 2. Try Identity PBKDF2 (Old Format)
            if (!passwordValid)
            {
                var result = _userManager.PasswordHasher.VerifyHashedPassword(user, user.PasswordHash!, loginDto.Password);
                if (result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded)
                {
                    passwordValid = true;
                    // Migrate to BCrypt
                    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(loginDto.Password);
                    user.PasswordSalt = "BCrypt";
                    await _userManager.UpdateAsync(user);
                }
            }

            if (!passwordValid)
            {
                throw new Exception("INVALID_CREDENTIALS");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "User";

            var accessToken = _jwtTokenService.GenerateAccessToken(user.Id, user.Email, user.Phone, role);
            var refreshTokenString = _jwtTokenService.GenerateRefreshToken();

            var refreshToken = new AppRefreshToken
            {
                UserId = user.Id,
                RefreshToken = refreshTokenString,
                DeviceInfo = deviceInfo,
                IpAddress = ipAddress,
                ExpiresAt = DateTime.UtcNow.AddDays(double.Parse(_config["Token:RefreshTokenExpiryDays"] ?? "7"))
            };

            _unitOfWork.Repository<AppRefreshToken>().Add(refreshToken);
            await _unitOfWork.Complete();

            var response = new LoginResponseDto
            {
                AccessToken = accessToken,
                ExpiresIn = int.Parse(_config["Token:AccessTokenExpiryMinutes"] ?? "15") * 60,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? "",
                    Name = user.FullName ?? user.UserName ?? "Customer",
                    Role = role
                }
            };

            return (Response: response, RefreshToken: refreshTokenString);
        }

        public async Task<(LoginResponseDto Response, string RefreshToken)> CustomerLoginAsync(string phone, string deviceInfo, string ipAddress)
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Phone == phone);

            if (user == null)
            {
                // Auto-create customer if not exists (or handle in checkout)
                throw new Exception("USER_NOT_FOUND");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Customer";

            var accessToken = _jwtTokenService.GenerateAccessToken(user.Id, user.Email, user.Phone, role);
            var refreshTokenString = _jwtTokenService.GenerateRefreshToken();

            var refreshToken = new AppRefreshToken
            {
                UserId = user.Id,
                RefreshToken = refreshTokenString,
                DeviceInfo = deviceInfo,
                IpAddress = ipAddress,
                ExpiresAt = DateTime.UtcNow.AddDays(double.Parse(_config["Token:RefreshTokenExpiryDays"] ?? "7"))
            };

            _unitOfWork.Repository<AppRefreshToken>().Add(refreshToken);
            await _unitOfWork.Complete();

            var response = new LoginResponseDto
            {
                AccessToken = accessToken,
                ExpiresIn = int.Parse(_config["Token:AccessTokenExpiryMinutes"] ?? "15") * 60,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? "",
                    Name = user.FullName ?? "Customer",
                    Role = role
                }
            };

            return (Response: response, RefreshToken: refreshTokenString);
        }

        public async Task<(AuthResponseDto Response, string RefreshToken)> RefreshTokenAsync(string refreshToken, string expiredAccessToken, string deviceInfo, string ipAddress)
        {
            var userToken = _unitOfWork.Repository<AppRefreshToken>().GetQueryable()
                .FirstOrDefault(x => x.RefreshToken == refreshToken);

            if (userToken == null || !userToken.IsActive)
            {
                if (userToken != null && userToken.IsRevoked)
                {
                    _jwtTokenService.RevokeAllUserTokens(userToken.UserId);
                    throw new Exception("TOKEN_REUSE_DETECTED");
                }
                throw new Exception("TOKEN_INVALID");
            }

            var principal = _jwtTokenService.GetPrincipalFromExpiredToken(expiredAccessToken);
            var userId = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

            if (userId == null || userId != userToken.UserId)
            {
                throw new Exception("TOKEN_INVALID");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) throw new Exception("USER_NOT_FOUND");

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "User";

            var newAccessToken = _jwtTokenService.GenerateAccessToken(user.Id, user.Email, user.Phone, role);
            var newRefreshTokenString = _jwtTokenService.GenerateRefreshToken();

            userToken.IsRevoked = true;
            userToken.RevokedAt = DateTime.UtcNow;
            userToken.ReplacedByToken = newRefreshTokenString;

            var newRefreshToken = new AppRefreshToken
            {
                UserId = user.Id,
                RefreshToken = newRefreshTokenString,
                DeviceInfo = deviceInfo,
                IpAddress = ipAddress,
                ExpiresAt = DateTime.UtcNow.AddDays(double.Parse(_config["Token:RefreshTokenExpiryDays"] ?? "7"))
            };

            _unitOfWork.Repository<AppRefreshToken>().Add(newRefreshToken);
            await _unitOfWork.Complete();

            var response = new AuthResponseDto
            {
                AccessToken = newAccessToken,
                ExpiresIn = int.Parse(_config["Token:AccessTokenExpiryMinutes"] ?? "15") * 60,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? "",
                    Name = user.FullName ?? user.UserName ?? "Customer",
                    Role = role
                }
            };

            return (Response: response, RefreshToken: newRefreshTokenString);
        }

        public async Task RevokeTokenAsync(string refreshToken)
        {
            var userToken = _unitOfWork.Repository<AppRefreshToken>().GetQueryable()
                .FirstOrDefault(x => x.RefreshToken == refreshToken);

            if (userToken != null)
            {
                userToken.IsRevoked = true;
                userToken.RevokedAt = DateTime.UtcNow;
                await _unitOfWork.Complete();
            }
        }

        public async Task LogoutAsync(string userId, string refreshToken)
        {
            await RevokeTokenAsync(refreshToken);
        }
    }
}

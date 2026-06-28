using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Auth;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthService> _logger;
        private readonly Cache.AppCache _appCache;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            IJwtTokenService jwtTokenService,
            IUnitOfWork unitOfWork,
            IConfiguration config,
            ILogger<AuthService> logger,
            Cache.AppCache appCache)
        {
            _userManager = userManager;
            _jwtTokenService = jwtTokenService;
            _unitOfWork = unitOfWork;
            _config = config;
            _logger = logger;
            _appCache = appCache;
        }

        public async Task<(LoginResponseDto Response, string RefreshToken)> LoginAsync(LoginDto loginDto, string deviceInfo, string ipAddress)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);

            if (user == null)
            {
                _logger.LogWarning("Login attempt for non-existent email {Email} from {IpAddress}", loginDto.Email, ipAddress);
                throw new InvalidOperationException("INVALID_CREDENTIALS");
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
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "BCrypt verification failed for user {UserId}, trying Identity", user.Id);
            }

            // 2. Try Identity PBKDF2 (Old Format)
            if (!passwordValid && !string.IsNullOrEmpty(user.PasswordHash))
            {
                try 
                {
                    if (!user.PasswordHash.StartsWith("$"))
                    {
                        var result = _userManager.PasswordHasher.VerifyHashedPassword(user, user.PasswordHash, loginDto.Password);
                        if (result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded)
                        {
                            passwordValid = true;
                            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(loginDto.Password);
                            user.PasswordSalt = "BCrypt";
                            await _userManager.UpdateAsync(user);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Identity password verification failed for user {UserId}", user.Id);
                }
            }

            if (!passwordValid)
            {
                _logger.LogWarning("Invalid password for user {UserId} from {IpAddress}", user.Id, ipAddress);
                throw new InvalidOperationException("INVALID_CREDENTIALS");
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
                ExpiresAt = DateTime.UtcNow.AddDays(double.TryParse(_config["Token:RefreshTokenExpiryDays"], out var refreshDays) ? refreshDays : 7)
            };

            _unitOfWork.Repository<AppRefreshToken>().Add(refreshToken);
            await _unitOfWork.Complete();

            var response = new LoginResponseDto
            {
                AccessToken = accessToken,
                ExpiresIn = (int.TryParse(_config["Token:AccessTokenExpiryMinutes"], out var accessMin) ? accessMin : 15) * 60,
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
            var customer = await _unitOfWork.Repository<Customer>().GetQueryable().FirstOrDefaultAsync(c => c.Phone == phone);

            if (customer == null)
            {
                customer = new Customer
                {
                    Phone = phone,
                    Name = "Guest Customer",
                    Address = "",
                    City = "",
                    Area = ""
                };
                _unitOfWork.Repository<Customer>().Add(customer);
                await _unitOfWork.Complete();
            }

            if (customer.IsSuspicious)
            {
                _logger.LogWarning("Deactivated/Suspicious customer login attempt for phone {Phone} from {IpAddress}", phone, ipAddress);
                throw new InvalidOperationException("ACCOUNT_DEACTIVATED");
            }

            var role = "Customer";
            var accessToken = _jwtTokenService.GenerateAccessToken(customer.Id.ToString(), null, customer.Phone, role);
            var refreshTokenString = _jwtTokenService.GenerateRefreshToken();

            if (!string.IsNullOrEmpty(customer.UserId))
            {
                var refreshToken = new AppRefreshToken
                {
                    UserId = customer.UserId,
                    RefreshToken = refreshTokenString,
                    DeviceInfo = deviceInfo,
                    IpAddress = ipAddress,
                    ExpiresAt = DateTime.UtcNow.AddDays(double.TryParse(_config["Token:RefreshTokenExpiryDays"], out var refreshDays) ? refreshDays : 7)
                };

                _unitOfWork.Repository<AppRefreshToken>().Add(refreshToken);
                await _unitOfWork.Complete();
            }

            var response = new LoginResponseDto
            {
                AccessToken = accessToken,
                ExpiresIn = (int.TryParse(_config["Token:AccessTokenExpiryMinutes"], out var accessMin) ? accessMin : 15) * 60,
                User = new UserDto
                {
                    Id = customer.Id.ToString(),
                    Email = "",
                    Name = customer.Name,
                    Role = role
                }
            };

            return (Response: response, RefreshToken: refreshTokenString);
        }

        public async Task<(AuthResponseDto Response, string RefreshToken)> RefreshTokenAsync(string refreshToken, string expiredAccessToken, string deviceInfo, string ipAddress)
        {
            var userToken = await _unitOfWork.Repository<AppRefreshToken>().GetQueryable()
                .FirstOrDefaultAsync(x => x.RefreshToken == refreshToken);

            if (userToken == null || !userToken.IsActive)
            {
                if (userToken != null && userToken.IsRevoked)
                {
                    _logger.LogWarning("Token reuse detected for user {UserId} from {IpAddress}", userToken.UserId, ipAddress);
                    await _jwtTokenService.RevokeAllUserTokensAsync(userToken.UserId);
                    throw new InvalidOperationException("TOKEN_REUSE_DETECTED");
                }
                throw new InvalidOperationException("TOKEN_INVALID");
            }

            var principal = _jwtTokenService.GetPrincipalFromExpiredToken(expiredAccessToken);
            var userId = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

            if (userId == null || userId != userToken.UserId)
            {
                throw new InvalidOperationException("TOKEN_INVALID");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) throw new InvalidOperationException("USER_NOT_FOUND");

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
                ExpiresAt = DateTime.UtcNow.AddDays(double.TryParse(_config["Token:RefreshTokenExpiryDays"], out var refreshDays) ? refreshDays : 7)
            };

            _unitOfWork.Repository<AppRefreshToken>().Add(newRefreshToken);
            await _unitOfWork.Complete();

            var response = new AuthResponseDto
            {
                AccessToken = newAccessToken,
                ExpiresIn = (int.TryParse(_config["Token:AccessTokenExpiryMinutes"], out var accessMin) ? accessMin : 15) * 60,
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
            var userToken = await _unitOfWork.Repository<AppRefreshToken>().GetQueryable()
                .FirstOrDefaultAsync(x => x.RefreshToken == refreshToken);

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

        public async Task LogoutAsync(string userId, string refreshToken, string? accessToken)
        {
            await RevokeTokenAsync(refreshToken);

            // Revoke the access token by adding its jti to the blacklist
            if (!string.IsNullOrEmpty(accessToken))
            {
                try
                {
                    var principal = _jwtTokenService.GetPrincipalFromExpiredToken(accessToken);
                    var jti = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value;
                    var exp = principal.FindFirst("exp")?.Value;
                    if (!string.IsNullOrEmpty(jti) && long.TryParse(exp, out var expUnix))
                    {
                        var expiresAt = DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime;
                        _appCache.RevokeAccessToken(jti, expiresAt);
                        _logger.LogInformation("Access token {Jti} revoked for user {UserId}", jti, userId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Failed to parse access token for revocation");
                }
            }
        }

        public async Task<UserDto> GetCurrentUserAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) throw new InvalidOperationException("USER_NOT_FOUND");

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Customer";

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                Name = user.FullName ?? user.UserName ?? "Customer",
                Role = role
            };
        }

        public async Task<(AdminAuthResponseDto Response, string RefreshToken)> AdminLoginAsync(string identifier, string password, string ipAddress)
        {
            var normalized = identifier.Trim();
            var user = await _userManager.Users
                .FirstOrDefaultAsync(u => u.Email == normalized || u.UserName == normalized);

            if (user == null)
            {
                _logger.LogWarning("Admin login attempt for non-existent identifier from {IpAddress}", ipAddress);
                throw new InvalidOperationException("INVALID_CREDENTIALS");
            }

            if (!user.IsActive)
                throw new InvalidOperationException("ACCOUNT_DEACTIVATED");

            var result = await _userManager.CheckPasswordAsync(user, password);
            if (!result)
            {
                _logger.LogWarning("Invalid admin password for user {UserId} from {IpAddress}", user.Id, ipAddress);
                throw new InvalidOperationException("INVALID_CREDENTIALS");
            }

            var dbRoles = await _userManager.GetRolesAsync(user);
            if (!dbRoles.Any() && !string.IsNullOrEmpty(user.Role))
                dbRoles = new List<string> { user.Role };
            if (!dbRoles.Any())
                dbRoles = new List<string> { "Customer" };

            var primaryRole = dbRoles.Contains("SuperAdmin") ? "SuperAdmin" : (dbRoles.FirstOrDefault() ?? "Customer");

            var accessToken = _jwtTokenService.GenerateAccessToken(user.Id, user.Email, user.Phone, primaryRole);
            var refreshTokenString = _jwtTokenService.GenerateRefreshToken();

            var refreshToken = new AppRefreshToken
            {
                UserId = user.Id,
                RefreshToken = refreshTokenString,
                DeviceInfo = "admin-web",
                IpAddress = ipAddress,
                ExpiresAt = DateTime.UtcNow.AddDays(double.TryParse(_config["Token:RefreshTokenExpiryDays"], out var refreshDays) ? refreshDays : 7)
            };

            _unitOfWork.Repository<AppRefreshToken>().Add(refreshToken);
            await _unitOfWork.Complete();

            var response = new AdminAuthResponseDto
            {
                Token = accessToken,
                RefreshToken = refreshTokenString,
                User = new UserSummaryDto
                {
                    Id = user.Id,
                    Name = user.FullName ?? user.UserName ?? "User",
                    Email = user.Email ?? string.Empty,
                    Role = primaryRole,
                    Phone = user.Phone,
                    Username = user.UserName,
                    AllowedMenus = user.AllowedMenus
                },
                ForceChangePassword = user.ForceChangePassword
            };

            return (Response: response, RefreshToken: refreshTokenString);
        }

        public async Task<UserSummaryDto?> GetUserSummaryAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return null;

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.Contains("SuperAdmin") ? "SuperAdmin" : (roles.FirstOrDefault() ?? user.Role ?? "Customer");

            return new UserSummaryDto
            {
                Id = user.Id,
                Name = user.FullName ?? user.UserName ?? "User",
                Email = user.Email ?? string.Empty,
                Role = role,
                Phone = user.Phone,
                Username = user.UserName,
                AllowedMenus = user.AllowedMenus
            };
        }

        public async Task AdminLogoutAsync(string userId)
        {
            var activeTokens = await _unitOfWork.Repository<AppRefreshToken>().GetQueryable()
                .Where(t => t.UserId == userId && !t.IsRevoked)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
            }

            await _unitOfWork.Complete();
        }

        public async Task AdminLogoutAsync(string userId, string? accessToken)
        {
            await AdminLogoutAsync(userId);

            // Revoke the access token if provided
            if (!string.IsNullOrEmpty(accessToken))
            {
                try
                {
                    var principal = _jwtTokenService.GetPrincipalFromExpiredToken(accessToken);
                    var jti = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value;
                    var exp = principal.FindFirst("exp")?.Value;
                    if (!string.IsNullOrEmpty(jti) && long.TryParse(exp, out var expUnix))
                    {
                        var expiresAt = DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime;
                        _appCache.RevokeAccessToken(jti, expiresAt);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Failed to parse admin access token for revocation");
                }
            }
        }

        public async Task<(AdminAuthResponseDto Response, string RefreshToken)> RefreshAdminTokenAsync(string refreshToken, string ipAddress)
        {
            var userToken = await _unitOfWork.Repository<AppRefreshToken>().GetQueryable()
                .FirstOrDefaultAsync(x => x.RefreshToken == refreshToken);

            if (userToken == null || !userToken.IsActive)
            {
                if (userToken != null && userToken.IsRevoked)
                {
                    _logger.LogWarning("Admin token reuse detected for user {UserId} from {IpAddress}", userToken.UserId, ipAddress);
                    await _jwtTokenService.RevokeAllUserTokensAsync(userToken.UserId);
                    throw new InvalidOperationException("TOKEN_REUSE_DETECTED");
                }
                throw new InvalidOperationException("TOKEN_INVALID");
            }

            var user = await _userManager.FindByIdAsync(userToken.UserId);
            if (user == null || !user.IsActive)
                throw new InvalidOperationException("TOKEN_INVALID");

            var roles = await _userManager.GetRolesAsync(user);
            if (!roles.Any() && !string.IsNullOrEmpty(user.Role))
                roles = new List<string> { user.Role };
            if (!roles.Any())
                roles = new List<string> { "Customer" };

            var primaryRole = roles.Contains("SuperAdmin") ? "SuperAdmin" : (roles.FirstOrDefault() ?? "Customer");

            var accessToken = _jwtTokenService.GenerateAccessToken(user.Id, user.Email, user.Phone, primaryRole);
            var refreshTokenString = _jwtTokenService.GenerateRefreshToken();

            userToken.IsRevoked = true;
            userToken.RevokedAt = DateTime.UtcNow;
            userToken.ReplacedByToken = refreshTokenString;

            var newRefreshToken = new AppRefreshToken
            {
                UserId = user.Id,
                RefreshToken = refreshTokenString,
                DeviceInfo = "admin-web",
                IpAddress = ipAddress,
                ExpiresAt = DateTime.UtcNow.AddDays(double.TryParse(_config["Token:RefreshTokenExpiryDays"], out var refreshDays) ? refreshDays : 7)
            };

            _unitOfWork.Repository<AppRefreshToken>().Add(newRefreshToken);
            await _unitOfWork.Complete();

            var response = new AdminAuthResponseDto
            {
                Token = accessToken,
                RefreshToken = refreshTokenString,
                User = new UserSummaryDto
                {
                    Id = user.Id,
                    Name = user.FullName ?? user.UserName ?? "User",
                    Email = user.Email ?? string.Empty,
                    Role = primaryRole,
                    Phone = user.Phone,
                    Username = user.UserName,
                    AllowedMenus = user.AllowedMenus
                },
                ForceChangePassword = user.ForceChangePassword
            };

            return (Response: response, RefreshToken: refreshTokenString);
        }

        public async Task ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) throw new InvalidOperationException("USER_NOT_FOUND");

            var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
            if (!result.Succeeded)
                throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));

            user.ForceChangePassword = false;
            await _userManager.UpdateAsync(user);
        }
    }
}

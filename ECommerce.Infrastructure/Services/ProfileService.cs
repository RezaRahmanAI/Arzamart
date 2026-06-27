using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace ECommerce.Infrastructure.Services;

public class ProfileService : IProfileService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public ProfileService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<ProfileResponseDto?> GetProfileAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return null;

        var roles = await _userManager.GetRolesAsync(user);

        return new ProfileResponseDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            Role = roles.FirstOrDefault() ?? user.Role
        };
    }

    public async Task<(bool Success, string? Error)> UpdateProfileAsync(string userId, UpdateProfileDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return (false, "User not found");

        var roles = await _userManager.GetRolesAsync(user);
        var isSuperAdmin = roles.Contains("SuperAdmin");

        if (isSuperAdmin && !string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
        {
            if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
                return (false, "Current password is required to change SuperAdmin email");

            var passwordCheck = await _userManager.CheckPasswordAsync(user, dto.CurrentPassword);
            if (!passwordCheck)
                return (false, "Invalid current password");
        }

        user.FullName = dto.FullName ?? user.FullName;
        user.Phone = dto.Phone ?? user.Phone;

        if (!string.IsNullOrWhiteSpace(dto.UserName) && dto.UserName != user.UserName)
        {
            var existing = await _userManager.FindByNameAsync(dto.UserName);
            if (existing != null && existing.Id != user.Id)
                return (false, "Username already taken");

            user.UserName = dto.UserName;
        }

        if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
        {
            var existing = await _userManager.FindByEmailAsync(dto.Email);
            if (existing != null && existing.Id != user.Id)
                return (false, "Email already taken");

            user.Email = dto.Email;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(e => e.Description)));

        return (true, null);
    }

    public async Task<(bool Success, IEnumerable<string> Errors)> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return (false, new[] { "User not found" });

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (!result.Succeeded)
            return (false, result.Errors.Select(e => e.Description));

        return (true, Array.Empty<string>());
    }
}

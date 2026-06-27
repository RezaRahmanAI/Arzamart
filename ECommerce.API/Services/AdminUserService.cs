using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using ECommerce.API.Helpers;
using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Admin;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Services;

public class AdminUserService : IAdminUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IActivityLogService _activityLogService;

    public AdminUserService(
        UserManager<ApplicationUser> userManager,
        IActivityLogService activityLogService)
    {
        _userManager = userManager;
        _activityLogService = activityLogService;
    }

    public async Task<List<AdminUserItemDto>> GetAllAsync()
    {
        return await _userManager.Users
            .Where(u => u.Role == "Admin" || u.Role == "SuperAdmin" || u.Role == "Staff")
            .Select(u => new AdminUserItemDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                UserName = u.UserName,
                Phone = u.Phone,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                AllowedMenus = u.AllowedMenusJson != null
                    ? JsonSerializer.Deserialize<List<string>>(u.AllowedMenusJson, (JsonSerializerOptions?)null) ?? new List<string>()
                    : new List<string>()
            })
            .OrderByDescending(u => u.Role == "SuperAdmin" ? 3 : u.Role == "Admin" ? 2 : 1)
            .ThenBy(u => u.FullName)
            .ToListAsync();
    }

    public async Task<(bool Success, string Message, AdminUserItemDto? User)> CreateAsync(CreateAdminUserDto dto, string performedByUserId, string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.Password))
            return (false, "Username and password are required", null);

        if (dto.Password.Length < 6)
            return (false, "Password must be at least 6 characters", null);

        var existingByUsername = await _userManager.FindByNameAsync(dto.UserName);
        if (existingByUsername != null)
            return (false, "User already exists with this username", null);

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var existingByEmail = await _userManager.FindByEmailAsync(dto.Email);
            if (existingByEmail != null)
                return (false, "User already exists with this email", null);
        }

        var role = string.IsNullOrWhiteSpace(dto.Role) ? "Staff" : dto.Role;
        if (role != "Admin" && role != "Staff" && role != "SuperAdmin")
            return (false, "Invalid role. Only Admin, Staff, and SuperAdmin roles can be created.", null);

        var user = new ApplicationUser
        {
            UserName = dto.UserName,
            Email = dto.Email,
            FullName = dto.FullName,
            Phone = dto.Phone,
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            EmailConfirmed = !string.IsNullOrWhiteSpace(dto.Email),
            AllowedMenus = role == "Staff" ? (dto.AllowedMenus ?? new List<string>()) : new List<string>(),
            ForceChangePassword = true
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(e => e.Description)), null);

        await _userManager.AddToRoleAsync(user, role);
        await _activityLogService.LogAsync(user.Id, "AccountCreated", $"Account created with role: {role}", ipAddress, performedByUserId);

        return (true, "Staff account created successfully", new AdminUserItemDto
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            AllowedMenus = user.AllowedMenus
        });
    }

    public async Task<(bool Success, string Message)> UpdateAsync(string id, UpdateAdminUserDto dto, string performedByUserId, string? ipAddress)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return (false, "User not found");

        var changes = new List<string>();

        if (!string.IsNullOrWhiteSpace(dto.UserName) && dto.UserName != user.UserName)
        {
            var existing = await _userManager.FindByNameAsync(dto.UserName);
            if (existing != null && existing.Id != user.Id)
                return (false, "Username already taken");
            changes.Add($"Username: {user.UserName} → {dto.UserName}");
            user.UserName = dto.UserName;
        }

        if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
        {
            var existing = await _userManager.FindByEmailAsync(dto.Email);
            if (existing != null && existing.Id != user.Id)
                return (false, "Email already taken");
            changes.Add("Email updated");
            user.Email = dto.Email;
        }

        if (!string.IsNullOrWhiteSpace(dto.Role) && dto.Role != user.Role)
        {
            if (dto.Role != "Admin" && dto.Role != "Staff" && dto.Role != "SuperAdmin")
                return (false, "Invalid role. Only Admin, Staff, and SuperAdmin roles are allowed.");

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, dto.Role);
            changes.Add($"Role: {user.Role} → {dto.Role}");
            user.Role = dto.Role;
        }

        if (dto.FullName != null && dto.FullName != user.FullName)
        {
            changes.Add("Name updated");
            user.FullName = dto.FullName;
        }

        if (dto.Phone != null && dto.Phone != user.Phone)
        {
            user.Phone = dto.Phone;
        }

        if (user.Role == "Staff")
        {
            if (dto.AllowedMenus != null)
            {
                changes.Add("Permissions updated");
                user.AllowedMenus = dto.AllowedMenus;
            }
        }
        else
        {
            user.AllowedMenus = new List<string>();
        }

        if (dto.ForceChangePassword.HasValue && dto.ForceChangePassword.Value != user.ForceChangePassword)
        {
            user.ForceChangePassword = dto.ForceChangePassword.Value;
            changes.Add($"ForceChangePassword: {(!dto.ForceChangePassword.Value ? "disabled" : "enabled")}");
        }

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            return (false, string.Join(", ", updateResult.Errors.Select(e => e.Description)));

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            if (dto.Password.Length < 6)
                return (false, "Password must be at least 6 characters");

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var passwordResult = await _userManager.ResetPasswordAsync(user, token, dto.Password);
            if (!passwordResult.Succeeded)
                return (false, "Profile updated, but password reset failed: " + string.Join(", ", passwordResult.Errors.Select(e => e.Description)));

            user.ForceChangePassword = true;
            await _userManager.UpdateAsync(user);
            changes.Add("Password changed");
        }

        if (changes.Count > 0)
            await _activityLogService.LogAsync(user.Id, "AccountUpdated", string.Join("; ", changes), ipAddress, performedByUserId);

        return (true, "User updated successfully");
    }

    public async Task<(bool Success, string Message)> ResetPasswordAsync(string id, ResetPasswordDto dto, string performedByUserId, string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword))
            return (false, "New password is required");

        if (dto.NewPassword.Length < 6)
            return (false, "Password must be at least 6 characters");

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return (false, "User not found");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);
        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(e => e.Description)));

        user.ForceChangePassword = true;
        await _userManager.UpdateAsync(user);

        await _activityLogService.LogAsync(user.Id, "PasswordReset", "Password was reset by SuperAdmin", ipAddress, performedByUserId);

        return (true, "Password reset successfully");
    }

    public async Task<(bool Success, UserStatusChangeResultDto Result)> ToggleActiveAsync(string id, string currentUserId)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return (false, new UserStatusChangeResultDto { Message = "User not found" });

        if (user.Id == currentUserId)
            return (false, new UserStatusChangeResultDto { Message = "You cannot deactivate your own account" });

        if (user.Role == "SuperAdmin")
            return (false, new UserStatusChangeResultDto { Message = "SuperAdmin accounts cannot be deactivated" });

        user.IsActive = !user.IsActive;
        await _userManager.UpdateAsync(user);

        await _activityLogService.LogAsync(user.Id, "StatusChanged", $"Account {(user.IsActive ? "activated" : "deactivated")}", null, currentUserId);

        return (true, new UserStatusChangeResultDto { Message = $"User {(user.IsActive ? "activated" : "deactivated")} successfully", IsActive = user.IsActive });
    }

    public async Task<List<AdminActivityLogEntryDto>> GetActivityLogAsync(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return new List<AdminActivityLogEntryDto>();

        var logs = await _activityLogService.GetRecentLogsAsync(id);
        return logs.Select(l => new AdminActivityLogEntryDto
        {
            Id = l.Id,
            Action = l.Action,
            Details = l.Details,
            IpAddress = l.IpAddress,
            CreatedAt = l.CreatedAt,
            PerformedByName = l.PerformedBy?.FullName
        }).ToList();
    }
}

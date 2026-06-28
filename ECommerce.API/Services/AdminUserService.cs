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
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IActivityLogService _activityLogService;

    public AdminUserService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IActivityLogService activityLogService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
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

        var passwordError = UserManagementHelper.ValidatePassword(dto.Password);
        if (!string.IsNullOrEmpty(passwordError))
            return (false, passwordError, null);

        var (usernameConflict, usernameMsg) = await UserManagementHelper.CheckUsernameConflictAsync(_userManager, dto.UserName);
        if (usernameConflict) return (false, usernameMsg!, null);

        var (emailConflict, emailMsg) = await UserManagementHelper.CheckEmailConflictAsync(_userManager, dto.Email);
        if (emailConflict) return (false, emailMsg!, null);

        var role = string.IsNullOrWhiteSpace(dto.Role) ? "Staff" : dto.Role;
        if (!UserManagementHelper.IsValidStaffRole(role))
        {
            var roleExists = await _roleManager.RoleExistsAsync(role);
            if (!roleExists)
                return (false, $"Invalid role: {role}", null);
        }

        List<string> allowedMenus = new List<string>();
        var dbRole = await _roleManager.FindByNameAsync(role);
        if (dbRole != null)
        {
            var claims = await _roleManager.GetClaimsAsync(dbRole);
            allowedMenus = claims.Where(c => c.Type == "AllowedMenu").Select(c => c.Value).ToList();
        }
        else
        {
            allowedMenus = dto.AllowedMenus ?? new List<string>();
        }

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
            AllowedMenus = allowedMenus,
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
            var (conflict, msg) = await UserManagementHelper.CheckUsernameConflictAsync(_userManager, dto.UserName, user.Id);
            if (conflict) return (false, msg!);
            changes.Add($"Username: {user.UserName} → {dto.UserName}");
            user.UserName = dto.UserName;
        }

        if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
        {
            var (conflict, msg) = await UserManagementHelper.CheckEmailConflictAsync(_userManager, dto.Email, user.Id);
            if (conflict) return (false, msg!);
            changes.Add("Email updated");
            user.Email = dto.Email;
        }

        if (!string.IsNullOrWhiteSpace(dto.Role) && dto.Role != user.Role)
        {
            if (!UserManagementHelper.IsValidStaffRole(dto.Role))
            {
                var roleExists = await _roleManager.RoleExistsAsync(dto.Role);
                if (!roleExists) return (false, $"Invalid role: {dto.Role}");
            }

            await UserManagementHelper.ChangeUserRoleAsync(_userManager, user, dto.Role);
            changes.Add($"Role: {user.Role} → {dto.Role}");
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

        // Synchronize permissions from role claims or manually if legacy
        var targetRole = user.Role;
        var targetDbRole = await _roleManager.FindByNameAsync(targetRole);
        if (targetDbRole != null)
        {
            var claims = await _roleManager.GetClaimsAsync(targetDbRole);
            var allowedMenus = claims.Where(c => c.Type == "AllowedMenu").Select(c => c.Value).ToList();
            var currentMenus = user.AllowedMenus;
            if (!currentMenus.OrderBy(m => m).SequenceEqual(allowedMenus.OrderBy(m => m)))
            {
                user.AllowedMenus = allowedMenus;
                changes.Add("Permissions synchronized from role");
            }
        }
        else
        {
            if (dto.AllowedMenus != null)
            {
                var currentMenus = user.AllowedMenus;
                if (!currentMenus.OrderBy(m => m).SequenceEqual(dto.AllowedMenus.OrderBy(m => m)))
                {
                    user.AllowedMenus = dto.AllowedMenus;
                    changes.Add("Permissions updated manually");
                }
            }
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
            var passwordError = UserManagementHelper.ValidatePassword(dto.Password);
            if (!string.IsNullOrEmpty(passwordError))
                return (false, passwordError);

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
        return await UserManagementHelper.ResetPasswordAsync(
            _userManager, id, dto.NewPassword, _activityLogService, performedByUserId, ipAddress);
    }

    public async Task<(bool Success, UserStatusChangeResultDto Result)> ToggleActiveAsync(string id, string currentUserId)
    {
        var (success, message) = await UserManagementHelper.ToggleActiveAsync(
            _userManager, id, currentUserId, _activityLogService);

        var user = success ? await _userManager.FindByIdAsync(id) : null;
        return (success, new UserStatusChangeResultDto
        {
            Message = message,
            IsActive = user?.IsActive ?? false
        });
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

using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace ECommerce.API.Services;

/// <summary>
/// Shared user management operations used by both StaffService and AdminUserService.
/// Eliminates duplicated username/email checks, role validation, and activity logging.
/// </summary>
public static class UserManagementHelper
{
    public static async Task<(bool Exists, string? Message)> CheckUsernameConflictAsync(
        UserManager<ApplicationUser> userManager, string username, string? excludeUserId = null)
    {
        var existing = await userManager.FindByNameAsync(username);
        if (existing != null && existing.Id != excludeUserId)
            return (true, "Username already taken");
        return (false, null);
    }

    public static async Task<(bool Exists, string? Message)> CheckEmailConflictAsync(
        UserManager<ApplicationUser> userManager, string? email, string? excludeUserId = null)
    {
        if (string.IsNullOrWhiteSpace(email)) return (false, null);
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null && existing.Id != excludeUserId)
            return (true, "User already exists with this email");
        return (false, null);
    }

    public static bool IsValidStaffRole(string? role)
    {
        return role is "Admin" or "Staff" or "SuperAdmin";
    }

    public static async Task SyncRoleClaimsAsync(
        UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, ApplicationUser user)
    {
        var dbRole = await roleManager.FindByNameAsync(user.Role);
        if (dbRole == null) return;

        var claims = await roleManager.GetClaimsAsync(dbRole);
        var allowedMenus = claims.Where(c => c.Type == "AllowedMenu").Select(c => c.Value).ToList();
        user.AllowedMenus = allowedMenus;
    }

    public static async Task ChangeUserRoleAsync(
        UserManager<ApplicationUser> userManager, ApplicationUser user, string newRole)
    {
        var currentRoles = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, currentRoles);
        await userManager.AddToRoleAsync(user, newRole);
        user.Role = newRole;
    }

    public static string ValidatePassword(string? password, int minLength = 8)
    {
        if (string.IsNullOrWhiteSpace(password))
            return "Password is required";

        if (password.Length < minLength)
            return $"Password must be at least {minLength} characters";

        if (!System.Text.RegularExpressions.Regex.IsMatch(password, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$"))
            return "Password must contain at least one uppercase letter, one lowercase letter, and one digit";

        return string.Empty;
    }

    public static async Task<(bool Success, string Message)> ResetPasswordAsync(
        UserManager<ApplicationUser> userManager, string userId, string newPassword,
        IActivityLogService activityLogService, string performedByUserId, string? ipAddress)
    {
        var validationError = ValidatePassword(newPassword);
        if (!string.IsNullOrEmpty(validationError))
            return (false, validationError);

        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return (false, "User not found");

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var result = await userManager.ResetPasswordAsync(user, token, newPassword);
        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(e => e.Description)));

        user.ForceChangePassword = true;
        await userManager.UpdateAsync(user);

        await activityLogService.LogAsync(user.Id, "PasswordReset", "Password was reset by SuperAdmin", ipAddress, performedByUserId);

        return (true, "Password reset successfully");
    }

    public static async Task<(bool Success, string Message)> ToggleActiveAsync(
        UserManager<ApplicationUser> userManager, string userId, string currentUserId,
        IActivityLogService activityLogService)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return (false, "User not found");

        if (user.Id == currentUserId)
            return (false, "You cannot deactivate your own account");

        if (user.Role == "SuperAdmin")
            return (false, "SuperAdmin accounts cannot be deactivated");

        user.IsActive = !user.IsActive;
        await userManager.UpdateAsync(user);

        await activityLogService.LogAsync(user.Id, "StatusChanged",
            $"Account {(user.IsActive ? "activated" : "deactivated")}", null, currentUserId);

        return (true, $"User {(user.IsActive ? "activated" : "deactivated")} successfully");
    }
}

using System;
using System.Collections.Frozen;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs.Staff;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Services;

public class StaffService : IStaffService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IActivityLogService _activityLogService;
    private readonly IUnitOfWork _unitOfWork;

    // Modules with their permissions — mirrors frontend RoleManagementComponent
    private static readonly FrozenDictionary<string, StaffModuleDto> _modules = new Dictionary<string, StaffModuleDto>
    {
        ["inventory"] = new StaffModuleDto
        {
            Id = "inventory", Name = "Inventory Management", Slug = "products",
            Permissions = new()
            {
                new() { Id = "inventory:view", Action = "view" },
                new() { Id = "inventory:create", Action = "create" },
                new() { Id = "inventory:edit", Action = "edit" },
                new() { Id = "inventory:delete", Action = "delete" }
            }
        },
        ["sales"] = new StaffModuleDto
        {
            Id = "sales", Name = "Sales & Orders", Slug = "orders",
            Permissions = new()
            {
                new() { Id = "sales:view", Action = "view" },
                new() { Id = "sales:edit", Action = "edit" },
                new() { Id = "sales:delete", Action = "delete" }
            }
        },
        ["hr"] = new StaffModuleDto
        {
            Id = "hr", Name = "Customer Management", Slug = "customers",
            Permissions = new()
            {
                new() { Id = "hr:view", Action = "view" },
                new() { Id = "hr:edit", Action = "edit" }
            }
        },
        ["reports"] = new StaffModuleDto
        {
            Id = "reports", Name = "Reports & Analytics", Slug = "analytics",
            Permissions = new()
            {
                new() { Id = "reports:view", Action = "view" }
            }
        },
        ["settings"] = new StaffModuleDto
        {
            Id = "settings", Name = "Settings & Configuration", Slug = "settings",
            Permissions = new()
            {
                new() { Id = "settings:view", Action = "view" },
                new() { Id = "settings:edit", Action = "edit" }
            }
        },
        ["staff-management"] = new StaffModuleDto
        {
            Id = "staff-management", Name = "Staff Management", Slug = "users",
            Permissions = new()
            {
                new() { Id = "staff-management:view", Action = "view" },
                new() { Id = "staff-management:create", Action = "create" },
                new() { Id = "staff-management:edit", Action = "edit" },
                new() { Id = "staff-management:delete", Action = "delete" }
            }
        }
    }.ToFrozenDictionary();

    private static readonly FrozenSet<string> _systemRoles = new HashSet<string> { "SuperAdmin", "Admin", "Staff", "Customer" }.ToFrozenSet();

    public StaffService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IActivityLogService activityLogService,
        IUnitOfWork unitOfWork)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _activityLogService = activityLogService;
        _unitOfWork = unitOfWork;
    }

    // ──────────────────────── Staff Users ────────────────────────

    public async Task<StaffUserListResultDto> GetStaffUsersAsync(string? search, string? roleId, bool? isActive, int page, int pageSize)
    {
        var query = _userManager.Users
            .Where(u => u.Role == "Admin" || u.Role == "SuperAdmin" || u.Role == "Staff");

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(term)) ||
                (u.Email != null && u.Email.ToLower().Contains(term)) ||
                (u.UserName != null && u.UserName.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(roleId))
        {
            // roleId is the Identity role name (we store it in the Role field)
            query = query.Where(u => u.Role == roleId);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.Role == "SuperAdmin" ? 3 : u.Role == "Admin" ? 2 : 1)
            .ThenBy(u => u.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = users.Select(u => new StaffUserDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            Username = u.UserName,
            IsActive = u.IsActive,
            RoleId = u.Role,
            RoleName = u.Role,
            CreatedAt = u.CreatedAt,
            ForceChangePassword = u.ForceChangePassword
        }).ToList();

        return new StaffUserListResultDto
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<StaffUserDto?> GetStaffUserAsync(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return null;

        return new StaffUserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Username = user.UserName,
            IsActive = user.IsActive,
            RoleId = user.Role,
            RoleName = user.Role,
            CreatedAt = user.CreatedAt,
            ForceChangePassword = user.ForceChangePassword
        };
    }

    public async Task<(bool Success, string Message, StaffUserDto? User)> CreateStaffAsync(CreateStaffDto dto, string performedByUserId, string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return (false, "Username and password are required", null);

        if (dto.Password.Length < 6)
            return (false, "Password must be at least 6 characters", null);

        var existingByUsername = await _userManager.FindByNameAsync(dto.Username);
        if (existingByUsername != null)
            return (false, "User already exists with this username", null);

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var existingByEmail = await _userManager.FindByEmailAsync(dto.Email);
            if (existingByEmail != null)
                return (false, "User already exists with this email", null);
        }

        // Resolve role name from roleId (which is just the role name string)
        var roleName = dto.RoleId;
        if (string.IsNullOrWhiteSpace(roleName)) roleName = "Staff";

        if (roleName != "Admin" && roleName != "Staff" && roleName != "SuperAdmin")
            return (false, "Invalid role. Only Admin, Staff, and SuperAdmin roles can be created.", null);

        var user = new ApplicationUser
        {
            UserName = dto.Username,
            Email = dto.Email,
            FullName = dto.FullName,
            Role = roleName,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            EmailConfirmed = !string.IsNullOrWhiteSpace(dto.Email),
            ForceChangePassword = dto.ForceChangePassword
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(e => e.Description)), null);

        await _userManager.AddToRoleAsync(user, roleName);
        await _activityLogService.LogAsync(user.Id, "AccountCreated", $"Account created with role: {roleName}", ipAddress, performedByUserId);

        var staffDto = new StaffUserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Username = user.UserName,
            IsActive = user.IsActive,
            RoleId = user.Role,
            RoleName = user.Role,
            CreatedAt = user.CreatedAt,
            ForceChangePassword = user.ForceChangePassword
        };

        return (true, "Staff account created successfully", staffDto);
    }

    public async Task<(bool Success, string Message)> UpdateStaffAsync(string id, UpdateStaffDto dto, string performedByUserId, string? ipAddress)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return (false, "User not found");

        var changes = new List<string>();

        if (!string.IsNullOrWhiteSpace(dto.Username) && dto.Username != user.UserName)
        {
            var existing = await _userManager.FindByNameAsync(dto.Username);
            if (existing != null && existing.Id != user.Id)
                return (false, "Username already taken");
            changes.Add($"Username: {user.UserName} → {dto.Username}");
            user.UserName = dto.Username;
        }

        if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
        {
            var existing = await _userManager.FindByEmailAsync(dto.Email);
            if (existing != null && existing.Id != user.Id)
                return (false, "Email already taken");
            changes.Add("Email updated");
            user.Email = dto.Email;
        }

        if (!string.IsNullOrWhiteSpace(dto.RoleId) && dto.RoleId != user.Role)
        {
            if (dto.RoleId != "Admin" && dto.RoleId != "Staff" && dto.RoleId != "SuperAdmin")
                return (false, "Invalid role. Only Admin, Staff, and SuperAdmin roles are allowed.");

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, dto.RoleId);
            changes.Add($"Role: {user.Role} → {dto.RoleId}");
            user.Role = dto.RoleId;
        }

        if (dto.FullName != null && dto.FullName != user.FullName)
        {
            changes.Add("Name updated");
            user.FullName = dto.FullName;
        }

        if (dto.ForceChangePassword != user.ForceChangePassword)
        {
            user.ForceChangePassword = dto.ForceChangePassword;
            changes.Add($"ForceChangePassword: {(dto.ForceChangePassword ? "enabled" : "disabled")}");
        }

        user.IsActive = dto.IsActive;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            return (false, string.Join(", ", updateResult.Errors.Select(e => e.Description)));

        if (changes.Count > 0)
            await _activityLogService.LogAsync(user.Id, "AccountUpdated", string.Join("; ", changes), ipAddress, performedByUserId);

        return (true, "Staff account updated successfully");
    }

    public async Task<(bool Success, string Message)> ToggleStaffStatusAsync(string id, bool isActive, string currentUserId)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return (false, "User not found");

        if (user.Id == currentUserId)
            return (false, "You cannot deactivate your own account");

        if (user.Role == "SuperAdmin")
            return (false, "SuperAdmin accounts cannot be deactivated");

        user.IsActive = isActive;
        await _userManager.UpdateAsync(user);

        await _activityLogService.LogAsync(user.Id, "StatusChanged", $"Account {(isActive ? "activated" : "deactivated")}", null, currentUserId);

        return (true, $"Account {(isActive ? "activated" : "deactivated")} successfully");
    }

    public async Task<(bool Success, string Message)> DeleteStaffAsync(string id, string performedByUserId, string? ipAddress)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return (false, "User not found");

        if (user.Role == "SuperAdmin")
            return (false, "SuperAdmin accounts cannot be deleted");

        // Soft delete — deactivate instead of hard delete
        user.IsActive = false;
        await _userManager.UpdateAsync(user);

        await _activityLogService.LogAsync(user.Id, "AccountDeleted", "Account soft-deleted", ipAddress, performedByUserId);

        return (true, "Staff account soft-deleted successfully");
    }

    public async Task<(bool Success, string Message)> ResetPasswordAsync(string id, string newPassword, string performedByUserId, string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(newPassword))
            return (false, "New password is required");

        if (newPassword.Length < 6)
            return (false, "Password must be at least 6 characters");

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return (false, "User not found");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(e => e.Description)));

        user.ForceChangePassword = true;
        await _userManager.UpdateAsync(user);

        await _activityLogService.LogAsync(user.Id, "PasswordReset", "Password was reset by SuperAdmin", ipAddress, performedByUserId);

        return (true, "Password reset successfully");
    }

    // ──────────────────────── Roles ────────────────────────

    public async Task<List<StaffRoleDto>> GetRolesAsync()
    {
        var roles = await _roleManager.Roles.ToListAsync();
        var result = new List<StaffRoleDto>();

        foreach (var role in roles)
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
            result.Add(new StaffRoleDto
            {
                Id = role.Name!,
                Name = role.Name!,
                Description = null,
                IsSystemRole = _systemRoles.Contains(role.Name!),
                CreatedAt = DateTime.MinValue, // Identity roles don't store CreatedAt
                StaffCount = usersInRole.Count(u => u.Role == role.Name)
            });
        }

        return result;
    }

    public async Task<(bool Success, string Message, string? Id)> CreateRoleAsync(CreateRoleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return (false, "Role name is required", null);

        if (await _roleManager.RoleExistsAsync(dto.Name))
            return (false, "Role already exists", null);

        var role = new IdentityRole(dto.Name);
        var result = await _roleManager.CreateAsync(role);
        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(e => e.Description)), null);

        return (true, "Role created successfully", role.Name);
    }

    public async Task<(bool Success, string Message)> UpdateRoleAsync(string id, UpdateRoleDto dto)
    {
        var role = await _roleManager.FindByNameAsync(id);
        if (role == null) return (false, "Role not found");

        if (_systemRoles.Contains(id))
            return (false, "System roles cannot be renamed");

        if (string.IsNullOrWhiteSpace(dto.Name))
            return (false, "Role name is required");

        if (await _roleManager.RoleExistsAsync(dto.Name) && dto.Name != id)
            return (false, "Role name already exists");

        role.Name = dto.Name;
        var result = await _roleManager.UpdateAsync(role);
        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(e => e.Description)));

        return (true, "Role updated successfully");
    }

    public async Task<(bool Success, string Message)> DeleteRoleAsync(string id)
    {
        var role = await _roleManager.FindByNameAsync(id);
        if (role == null) return (false, "Role not found");

        if (_systemRoles.Contains(id))
            return (false, "System roles cannot be deleted");

        var usersInRole = await _userManager.GetUsersInRoleAsync(id);
        if (usersInRole.Any())
            return (false, "Cannot delete role because staff members are assigned to it");

        var result = await _roleManager.DeleteAsync(role);
        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(e => e.Description)));

        return (true, "Role deleted successfully");
    }

    public async Task<List<string>> GetRolePermissionsAsync(string roleId)
    {
        // Permissions are stored as AllowedMenus on Staff users.
        // For role-level permissions, we return the union of all staff users' AllowedMenus in this role.
        // However, the frontend expects permission IDs like "inventory:view", "sales:edit" etc.
        // Since we don't have a RolePermission entity, return empty — the frontend will show unchecked.
        // The actual permission enforcement is done via AllowedMenus on each user.
        return await Task.FromResult(new List<string>());
    }

    public Task<(bool Success, string Message)> UpdateRolePermissionsAsync(string roleId, List<string> permissionIds)
    {
        // Role-level permissions are not stored separately in this schema.
        // Permissions are enforced per-user via AllowedMenus.
        // This endpoint is a no-op for now — the frontend will call it but permissions are managed per-user.
        return Task.FromResult((true, "Role permissions updated (note: permissions are enforced per-user via AllowedMenus)"));
    }

    // ──────────────────────── Modules ────────────────────────

    public Task<List<StaffModuleDto>> GetModulesAsync()
    {
        return Task.FromResult(_modules.Values.ToList());
    }

    // ──────────────────────── Audit Logs ────────────────────────

    public async Task<StaffAuditLogListResultDto> GetAuditLogsAsync(string? actorId, string? action, DateTime? startDate, DateTime? endDate, int page, int pageSize)
    {
        var query = _unitOfWork.Repository<AdminActivityLog>().GetQueryable()
            .Include(l => l.User)
            .Include(l => l.PerformedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(actorId))
            query = query.Where(l => l.PerformedByUserId == actorId);

        if (!string.IsNullOrWhiteSpace(action))
            query = query.Where(l => l.Action.Contains(action));

        if (startDate.HasValue)
            query = query.Where(l => l.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(l => l.CreatedAt <= endDate.Value);

        var totalCount = await query.CountAsync();

        var paged = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new StaffAuditLogDto
            {
                Id = l.Id.ToString(),
                ActorId = l.PerformedByUserId,
                ActorName = l.PerformedBy != null ? l.PerformedBy.FullName ?? l.PerformedBy.UserName ?? "Unknown" : "Unknown",
                ActorUsername = l.PerformedBy != null ? l.PerformedBy.UserName ?? "unknown" : "unknown",
                Action = l.Action,
                TargetStaffId = l.UserId,
                TargetStaffName = l.User != null ? l.User.FullName : null,
                Details = l.Details,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();

        return new StaffAuditLogListResultDto
        {
            Items = paged,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}

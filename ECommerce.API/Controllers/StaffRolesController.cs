using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[Authorize(Policy = "SuperAdminOnly")]
[ApiController]
[Route("api/staff/roles")]
public class StaffRolesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StaffRolesController(ApplicationDbContext context)
    {
        _context = context;
    }

    private Guid? GetActorId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(idClaim, out var guid) ? guid : null;
    }

    private async Task LogAuditAsync(string action, Guid? targetStaffId, object? details = null)
    {
        var actorId = GetActorId();
        var log = new StaffAuditLog
        {
            Id = Guid.NewGuid(),
            ActorId = actorId,
            Action = action,
            TargetStaffId = targetStaffId,
            Details = details != null ? System.Text.Json.JsonSerializer.Serialize(details) : null,
            CreatedAt = DateTime.UtcNow
        };
        _context.StaffAuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _context.StaffRoles
            .Select(r => new
            {
                id = r.Id,
                name = r.Name,
                description = r.Description,
                isSystemRole = r.IsSystemRole,
                createdAt = r.CreatedAt,
                staffCount = _context.StaffUsers.Count(u => u.RoleId == r.Id && u.DeletedAt == null)
            })
            .OrderBy(r => r.name)
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = roles,
            message = "Roles retrieved successfully."
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Role Name is required." });
        }

        var exists = await _context.StaffRoles.AnyAsync(r => r.Name.ToLower() == request.Name.Trim().ToLower());
        if (exists)
        {
            return BadRequest(new { success = false, error = "DUPLICATE_ROLE_NAME", message = "A role with this name already exists." });
        }

        var newRole = new StaffRole
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsSystemRole = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.StaffRoles.Add(newRole);
        await _context.SaveChangesAsync();

        await LogAuditAsync("CREATE_ROLE", null, new { roleId = newRole.Id, roleName = newRole.Name });

        return Ok(new
        {
            success = true,
            data = new { id = newRole.Id },
            message = "Role created successfully."
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Role Name is required." });
        }

        var role = await _context.StaffRoles.FirstOrDefaultAsync(r => r.Id == id);
        if (role == null)
        {
            return NotFound(new { success = false, error = "NOT_FOUND", message = "Role not found." });
        }

        if (role.IsSystemRole)
        {
            // Block renaming system roles
            if (role.Name != request.Name.Trim())
            {
                return BadRequest(new { success = false, error = "SYSTEM_ROLE_PROTECTED", message = "System roles cannot be renamed." });
            }
        }

        var nameExists = await _context.StaffRoles.AnyAsync(r => r.Id != id && r.Name.ToLower() == request.Name.Trim().ToLower());
        if (nameExists)
        {
            return BadRequest(new { success = false, error = "DUPLICATE_ROLE_NAME", message = "Another role with this name already exists." });
        }

        var oldName = role.Name;
        role.Name = request.Name.Trim();
        role.Description = request.Description?.Trim();

        await _context.SaveChangesAsync();

        await LogAuditAsync("UPDATE_ROLE", null, new { roleId = role.Id, oldName, newName = role.Name });

        return Ok(new
        {
            success = true,
            message = "Role updated successfully."
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRole(Guid id)
    {
        var role = await _context.StaffRoles.FirstOrDefaultAsync(r => r.Id == id);
        if (role == null)
        {
            return NotFound(new { success = false, error = "NOT_FOUND", message = "Role not found." });
        }

        if (role.IsSystemRole)
        {
            return BadRequest(new { success = false, error = "SYSTEM_ROLE_PROTECTED", message = "System roles cannot be deleted." });
        }

        var hasAssignedStaff = await _context.StaffUsers.AnyAsync(u => u.RoleId == id && u.DeletedAt == null);
        if (hasAssignedStaff)
        {
            return BadRequest(new { success = false, error = "ROLE_ASSIGNED", message = "Cannot delete role because it is currently assigned to staff users." });
        }

        _context.StaffRoles.Remove(role);
        await _context.SaveChangesAsync();

        await LogAuditAsync("DELETE_ROLE", null, new { roleId = role.Id, roleName = role.Name });

        return Ok(new
        {
            success = true,
            message = "Role deleted successfully."
        });
    }

    [HttpGet("{id}/permissions")]
    public async Task<IActionResult> GetRolePermissions(Guid id)
    {
        var role = await _context.StaffRoles.AnyAsync(r => r.Id == id);
        if (!role)
        {
            return NotFound(new { success = false, error = "NOT_FOUND", message = "Role not found." });
        }

        var permissionIds = await _context.StaffRolePermissions
            .Where(rp => rp.RoleId == id)
            .Select(rp => rp.PermissionId)
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = permissionIds,
            message = "Permissions retrieved successfully."
        });
    }

    [HttpPut("{id}/permissions")]
    public async Task<IActionResult> UpdateRolePermissions(Guid id, [FromBody] UpdatePermissionsRequest request)
    {
        if (request == null || request.PermissionIds == null)
        {
            return BadRequest(new { success = false, error = "BAD_REQUEST", message = "Permission IDs are required." });
        }

        var role = await _context.StaffRoles.FirstOrDefaultAsync(r => r.Id == id);
        if (role == null)
        {
            return NotFound(new { success = false, error = "NOT_FOUND", message = "Role not found." });
        }

        // Clear existing permissions
        var existing = await _context.StaffRolePermissions
            .Where(rp => rp.RoleId == id)
            .ToListAsync();
        
        _context.StaffRolePermissions.RemoveRange(existing);

        // Add new permissions
        foreach (var permId in request.PermissionIds)
        {
            var exists = await _context.StaffPermissions.AnyAsync(p => p.Id == permId);
            if (exists)
            {
                _context.StaffRolePermissions.Add(new StaffRolePermission
                {
                    RoleId = id,
                    PermissionId = permId
                });
            }
        }

        await _context.SaveChangesAsync();

        await LogAuditAsync("UPDATE_ROLE_PERMISSIONS", null, new { roleId = role.Id, roleName = role.Name, permissionCount = request.PermissionIds.Count });

        return Ok(new
        {
            success = true,
            message = "Role permissions updated successfully."
        });
    }
}

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdatePermissionsRequest
{
    public List<Guid> PermissionIds { get; set; } = new();
}

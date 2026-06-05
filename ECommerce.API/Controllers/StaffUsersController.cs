using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ECommerce.API.Controllers;

[Authorize(Policy = "SuperAdminOnly")]
[ApiController]
[Route("api/staff/users")]
public class StaffUsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public StaffUsersController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private Guid? GetActorId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(idClaim, out var guid) ? guid : null;
    }

    private string GetEncryptionKey()
    {
        return _configuration["StaffSettings:PasswordEncryptionKey"] 
               ?? Environment.GetEnvironmentVariable("STAFF_PWD_ENCRYPTION_KEY") 
               ?? "default_development_key_32_bytes_long_abcd";
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
    public async Task<IActionResult> GetStaffUsers([FromQuery] string? search, [FromQuery] Guid? roleId, [FromQuery] bool? isActive, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _context.StaffUsers
            .Include(u => u.Role)
            .AsQueryable();

        // Search by name, email, or username
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u => u.FullName.ToLower().Contains(searchLower) || 
                                     u.Email.ToLower().Contains(searchLower) || 
                                     u.Username.ToLower().Contains(searchLower));
        }

        // Filter by role
        if (roleId.HasValue)
        {
            query = query.Where(u => u.RoleId == roleId.Value);
        }

        // Filter by active status
        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                id = u.Id,
                fullName = u.FullName,
                email = u.Email,
                username = u.Username,
                isActive = u.IsActive,
                roleId = u.RoleId,
                roleName = u.Role.Name,
                createdAt = u.CreatedAt,
                updatedAt = u.UpdatedAt,
                createdBy = u.CreatedBy,
                forceChangePassword = u.ForceChangePassword
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                items,
                page,
                pageSize,
                totalCount
            },
            message = "Staff users retrieved successfully."
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetStaffUser(Guid id)
    {
        var user = await _context.StaffUsers
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new { success = false, error = "NOT_FOUND", message = "Staff user not found." });
        }

        return Ok(new
        {
            success = true,
            data = new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                username = user.Username,
                isActive = user.IsActive,
                roleId = user.RoleId,
                roleName = user.Role.Name,
                createdAt = user.CreatedAt,
                updatedAt = user.UpdatedAt,
                createdBy = user.CreatedBy,
                forceChangePassword = user.ForceChangePassword
            },
            message = "Staff details retrieved successfully."
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest request)
    {
        if (request == null)
        {
            return BadRequest(new { success = false, error = "BAD_REQUEST", message = "Invalid input data." });
        }

        // Server-side validation
        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Full Name is required." });
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Email is required." });
        if (string.IsNullOrWhiteSpace(request.Username))
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Username is required." });
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Password must be at least 6 characters." });
        if (request.RoleId == Guid.Empty)
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Role is required." });

        // Uniqueness checks
        var emailExists = await _context.StaffUsers.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (emailExists)
            return BadRequest(new { success = false, error = "DUPLICATE_EMAIL", message = "Email is already in use." });

        var usernameExists = await _context.StaffUsers.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower());
        if (usernameExists)
            return BadRequest(new { success = false, error = "DUPLICATE_USERNAME", message = "Username is already in use." });

        var roleExists = await _context.StaffRoles.AnyAsync(r => r.Id == request.RoleId);
        if (!roleExists)
            return BadRequest(new { success = false, error = "ROLE_NOT_FOUND", message = "Specified role does not exist." });

        // Password hash and encrypt
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12);
        var passwordEncrypted = PasswordEncryption.Encrypt(request.Password, GetEncryptionKey());

        var actorId = GetActorId();

        var newUser = new StaffUser
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLower(),
            Username = request.Username.Trim().ToLower(),
            PasswordHash = passwordHash,
            PasswordPlainEncrypted = passwordEncrypted,
            IsActive = request.IsActive,
            RoleId = request.RoleId,
            CreatedBy = actorId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ForceChangePassword = request.ForceChangePassword
        };

        _context.StaffUsers.Add(newUser);
        await _context.SaveChangesAsync();

        // Log audit
        await LogAuditAsync("CREATE_STAFF", newUser.Id, new { username = newUser.Username, roleId = newUser.RoleId });

        return Ok(new
        {
            success = true,
            data = new { id = newUser.Id },
            message = "Staff created successfully"
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStaff(Guid id, [FromBody] UpdateStaffRequest request)
    {
        if (request == null)
        {
            return BadRequest(new { success = false, error = "BAD_REQUEST", message = "Invalid input data." });
        }

        var user = await _context.StaffUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { success = false, error = "NOT_FOUND", message = "Staff user not found." });
        }

        // Server-side validation
        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Full Name is required." });
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Email is required." });
        if (string.IsNullOrWhiteSpace(request.Username))
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Username is required." });
        if (request.RoleId == Guid.Empty)
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Role is required." });

        // Uniqueness checks excluding current user
        var emailExists = await _context.StaffUsers.AnyAsync(u => u.Id != id && u.Email.ToLower() == request.Email.ToLower());
        if (emailExists)
            return BadRequest(new { success = false, error = "DUPLICATE_EMAIL", message = "Email is already in use by another user." });

        var usernameExists = await _context.StaffUsers.AnyAsync(u => u.Id != id && u.Username.ToLower() == request.Username.ToLower());
        if (usernameExists)
            return BadRequest(new { success = false, error = "DUPLICATE_USERNAME", message = "Username is already in use by another user." });

        var roleExists = await _context.StaffRoles.AnyAsync(r => r.Id == request.RoleId);
        if (!roleExists)
            return BadRequest(new { success = false, error = "ROLE_NOT_FOUND", message = "Specified role does not exist." });

        var oldRoleId = user.RoleId;
        user.FullName = request.FullName.Trim();
        user.Email = request.Email.Trim().ToLower();
        user.Username = request.Username.Trim().ToLower();
        user.RoleId = request.RoleId;
        user.IsActive = request.IsActive;
        user.ForceChangePassword = request.ForceChangePassword;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Log audit
        await LogAuditAsync("UPDATE_STAFF", user.Id, new { username = user.Username, oldRoleId, newRoleId = user.RoleId });

        return Ok(new
        {
            success = true,
            message = "Staff updated successfully"
        });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ToggleStatus(Guid id, [FromBody] ToggleStatusRequest request)
    {
        var actorId = GetActorId();
        if (id == actorId)
        {
            return BadRequest(new { success = false, error = "SELF_MODIFICATION", message = "A staff member cannot deactivate their own account." });
        }

        var user = await _context.StaffUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { success = false, error = "NOT_FOUND", message = "Staff user not found." });
        }

        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Log audit
        await LogAuditAsync(request.IsActive ? "ACTIVATE_STAFF" : "DEACTIVATE_STAFF", user.Id);

        return Ok(new
        {
            success = true,
            message = $"Staff account {(request.IsActive ? "activated" : "deactivated")} successfully."
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStaff(Guid id)
    {
        var actorId = GetActorId();
        if (id == actorId)
        {
            return BadRequest(new { success = false, error = "SELF_MODIFICATION", message = "A staff member cannot delete their own account." });
        }

        var user = await _context.StaffUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { success = false, error = "NOT_FOUND", message = "Staff user not found." });
        }

        // Soft delete
        user.DeletedAt = DateTime.UtcNow;
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Log audit
        await LogAuditAsync("DELETE_STAFF", user.Id);

        return Ok(new
        {
            success = true,
            message = "Staff account deleted successfully."
        });
    }

    [HttpGet("{id}/password")]
    public async Task<IActionResult> ViewPassword(Guid id)
    {
        var user = await _context.StaffUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { success = false, error = "NOT_FOUND", message = "Staff user not found." });
        }

        string decryptedPassword;
        try
        {
            decryptedPassword = PasswordEncryption.Decrypt(user.PasswordPlainEncrypted, GetEncryptionKey());
        }
        catch (Exception)
        {
            return BadRequest(new { success = false, error = "DECRYPTION_FAILED", message = "Could not decrypt the stored password." });
        }

        // Log audit immediately
        await LogAuditAsync("VIEW_PASSWORD", user.Id, new { warning = "This action was logged in audit trail" });

        return Ok(new
        {
            success = true,
            data = new { password = decryptedPassword },
            message = "Password decrypted successfully. This action has been logged in the audit trail."
        });
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        {
            return BadRequest(new { success = false, error = "VALIDATION_FAILED", message = "Password must be at least 6 characters." });
        }

        var user = await _context.StaffUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { success = false, error = "NOT_FOUND", message = "Staff user not found." });
        }

        // Hash and encrypt new password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12);
        var passwordEncrypted = PasswordEncryption.Encrypt(request.Password, GetEncryptionKey());

        user.PasswordHash = passwordHash;
        user.PasswordPlainEncrypted = passwordEncrypted;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Log audit
        await LogAuditAsync("RESET_PASSWORD", user.Id);

        return Ok(new
        {
            success = true,
            message = "Password reset successfully."
        });
    }
}

public class CreateStaffRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public Guid RoleId { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ForceChangePassword { get; set; } = false;
}

public class UpdateStaffRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public Guid RoleId { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ForceChangePassword { get; set; } = false;
}

public class ToggleStatusRequest
{
    public bool IsActive { get; set; }
}

public class ResetPasswordRequest
{
    public string Password { get; set; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs.Staff;

public class StaffUserDto
{
    public string Id { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Username { get; set; }
    public bool IsActive { get; set; }
    public string? RoleId { get; set; }
    public string? RoleName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public bool ForceChangePassword { get; set; }
}

public class CreateStaffDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;

    [Required]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$", ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, and one digit")]
    public string Password { get; set; } = string.Empty;

    public string RoleId { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool ForceChangePassword { get; set; } = false;
}

public class UpdateStaffDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool ForceChangePassword { get; set; } = false;
}

public class StaffUserListResultDto
{
    public List<StaffUserDto> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
}

public class ToggleStatusDto
{
    public bool IsActive { get; set; }
}

public class ResetPasswordStaffDto
{
    [Required]
    [MinLength(8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$", ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, and one digit")]
    public string Password { get; set; } = string.Empty;
}

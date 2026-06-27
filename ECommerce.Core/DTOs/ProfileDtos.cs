using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs;

public class UpdateProfileDto
{
    public string? FullName { get; set; }
    [EmailAddress]
    public string? Email { get; set; }
    public string? UserName { get; set; }
    public string? Phone { get; set; }
    public string? CurrentPassword { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}

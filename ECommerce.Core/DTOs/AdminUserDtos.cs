namespace ECommerce.Core.DTOs;

public class CreateAdminUserDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public List<string>? AllowedMenus { get; set; }
    public bool ForceChangePassword { get; set; } = true;
}

public class UpdateAdminUserDto
{
    public string? FullName { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
    public string? Phone { get; set; }
    public string? Password { get; set; }
    public List<string>? AllowedMenus { get; set; }
    public bool? ForceChangePassword { get; set; }
}

public class ResetPasswordDto
{
    public string NewPassword { get; set; } = string.Empty;
}

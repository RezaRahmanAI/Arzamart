using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace ECommerce.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = "Customer"; // Customer or Admin
    public bool IsSuspicious { get; set; } = false;

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // JWT columns
    public string? PasswordSalt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public virtual ICollection<AppRefreshToken> RefreshTokens { get; set; } = new List<AppRefreshToken>();

    public string? AllowedMenusJson { get; set; }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public List<string> AllowedMenus
    {
        get => string.IsNullOrEmpty(AllowedMenusJson) ? new List<string>() : System.Text.Json.JsonSerializer.Deserialize<List<string>>(AllowedMenusJson) ?? new List<string>();
        set => AllowedMenusJson = System.Text.Json.JsonSerializer.Serialize(value);
    }
}

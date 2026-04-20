using System;
using Microsoft.AspNetCore.Identity;
using ECommerce.Core.Entities;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerce.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        // 1. Ensure Roles Exist
        if (!await roleManager.RoleExistsAsync("SuperAdmin"))
        {
            await roleManager.CreateAsync(new IdentityRole("SuperAdmin"));
        }

        if (!await roleManager.RoleExistsAsync("Admin"))
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
        }

        if (!await roleManager.RoleExistsAsync("Customer"))
        {
            await roleManager.CreateAsync(new IdentityRole("Customer"));
        }

        // 2. Ensure Super Admin User exists
        var adminEmail = "admin@arzamart.com";
        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);

        if (existingAdmin == null)
        {
            var newAdmin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Arza Super Admin",
                EmailConfirmed = true,
                Role = "SuperAdmin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            // This will correctly hash the password "Arzamart@321" using Identity's PasswordHasher
            var result = await userManager.CreateAsync(newAdmin, "Arzamart@321");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(newAdmin, "SuperAdmin");
            }
        }
        else 
        {
            // Update existing admin to SuperAdmin if needed
            if (existingAdmin.Role != "SuperAdmin")
            {
                existingAdmin.Role = "SuperAdmin";
                await userManager.UpdateAsync(existingAdmin);
                
                // Add to identity role too
                if (!await userManager.IsInRoleAsync(existingAdmin, "SuperAdmin"))
                {
                    await userManager.AddToRoleAsync(existingAdmin, "SuperAdmin");
                }
            }
        }
    }
}

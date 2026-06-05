using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ECommerce.Infrastructure.Data;

public static class StaffDataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, IConfiguration configuration)
    {
        // 1. Seed Modules and Permissions
        var moduleDefinitions = new List<(string Name, string Slug, string[] Actions)>
        {
            ("Sales", "sales", new[] { "view", "create", "edit", "delete", "export" }),
            ("Inventory", "inventory", new[] { "view", "create", "edit", "delete", "export" }),
            ("HR", "hr", new[] { "view", "create", "edit", "delete", "export" }),
            ("Reports", "reports", new[] { "view", "create", "edit", "delete", "export" }),
            ("Settings", "settings", new[] { "view", "create", "edit", "delete", "export" }),
            ("Staff Management", "staff-management", new[] { "view", "create", "edit", "delete", "export" })
        };

        foreach (var def in moduleDefinitions)
        {
            var module = await context.StaffModules
                .Include(m => m.Permissions)
                .FirstOrDefaultAsync(m => m.Slug == def.Slug);

            if (module == null)
            {
                module = new StaffModule
                {
                    Id = Guid.NewGuid(),
                    Name = def.Name,
                    Slug = def.Slug,
                    Description = $"{def.Name} Module"
                };
                context.StaffModules.Add(module);
            }

            foreach (var action in def.Actions)
            {
                var hasPermission = module.Permissions.Any(p => p.Action == action);
                if (!hasPermission)
                {
                    context.StaffPermissions.Add(new StaffPermission
                    {
                        Id = Guid.NewGuid(),
                        ModuleId = module.Id,
                        Action = action
                    });
                }
            }
        }

        await context.SaveChangesAsync();

        // Fetch all permissions for role assignment
        var allPermissions = await context.StaffPermissions
            .Include(p => p.Module)
            .ToListAsync();

        // 2. Seed Default Roles
        var encryptionKey = configuration["StaffSettings:PasswordEncryptionKey"] 
                            ?? Environment.GetEnvironmentVariable("STAFF_PWD_ENCRYPTION_KEY") 
                            ?? "default_development_key_32_bytes_long_abcd";

        // Super Admin Role
        var superAdminRole = await context.StaffRoles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Name == "Super Admin");

        if (superAdminRole == null)
        {
            superAdminRole = new StaffRole
            {
                Id = Guid.NewGuid(),
                Name = "Super Admin",
                Description = "System role with full privileges",
                IsSystemRole = true,
                CreatedAt = DateTime.UtcNow
            };
            context.StaffRoles.Add(superAdminRole);
            await context.SaveChangesAsync();
        }

        // Ensure Super Admin has all permissions
        foreach (var permission in allPermissions)
        {
            var hasPerm = superAdminRole.RolePermissions.Any(rp => rp.PermissionId == permission.Id);
            if (!hasPerm)
            {
                context.StaffRolePermissions.Add(new StaffRolePermission
                {
                    RoleId = superAdminRole.Id,
                    PermissionId = permission.Id
                });
            }
        }

        // Manager Role
        var managerRole = await context.StaffRoles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Name == "Manager");

        if (managerRole == null)
        {
            managerRole = new StaffRole
            {
                Id = Guid.NewGuid(),
                Name = "Manager",
                Description = "Manage sales, inventory and view reports",
                IsSystemRole = true,
                CreatedAt = DateTime.UtcNow
            };
            context.StaffRoles.Add(managerRole);
            await context.SaveChangesAsync();
        }

        // Manager Permissions: sales:*, inventory:*, reports:view, reports:export
        var managerAllowed = allPermissions.Where(p => 
            p.Module.Slug == "sales" || 
            p.Module.Slug == "inventory" || 
            (p.Module.Slug == "reports" && (p.Action == "view" || p.Action == "export"))
        ).ToList();

        foreach (var permission in managerAllowed)
        {
            var hasPerm = managerRole.RolePermissions.Any(rp => rp.PermissionId == permission.Id);
            if (!hasPerm)
            {
                context.StaffRolePermissions.Add(new StaffRolePermission
                {
                    RoleId = managerRole.Id,
                    PermissionId = permission.Id
                });
            }
        }

        // Viewer Role
        var viewerRole = await context.StaffRoles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Name == "Viewer");

        if (viewerRole == null)
        {
            viewerRole = new StaffRole
            {
                Id = Guid.NewGuid(),
                Name = "Viewer",
                Description = "Read-only access to sales, inventory and reports",
                IsSystemRole = true,
                CreatedAt = DateTime.UtcNow
            };
            context.StaffRoles.Add(viewerRole);
            await context.SaveChangesAsync();
        }

        // Viewer Permissions: sales:view, inventory:view, reports:view
        var viewerAllowed = allPermissions.Where(p => 
            p.Action == "view" && 
            (p.Module.Slug == "sales" || p.Module.Slug == "inventory" || p.Module.Slug == "reports")
        ).ToList();

        foreach (var permission in viewerAllowed)
        {
            var hasPerm = viewerRole.RolePermissions.Any(rp => rp.PermissionId == permission.Id);
            if (!hasPerm)
            {
                context.StaffRolePermissions.Add(new StaffRolePermission
                {
                    RoleId = viewerRole.Id,
                    PermissionId = permission.Id
                });
            }
        }

        await context.SaveChangesAsync();

        // 3. Seed Default Super Admin Account
        var superAdminEmail = "admin@yourdomain.com";
        var superAdminUsername = "superadmin";

        var hasSuperAdminUser = await context.StaffUsers.AnyAsync(u => u.Username == superAdminUsername || u.Email == superAdminEmail);
        if (!hasSuperAdminUser)
        {
            var plainPassword = "SuperAdmin@123";
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(plainPassword, 12);
            var passwordEncrypted = PasswordEncryption.Encrypt(plainPassword, encryptionKey);

            var superAdminUser = new StaffUser
            {
                Id = Guid.NewGuid(),
                FullName = "Super Admin",
                Email = superAdminEmail,
                Username = superAdminUsername,
                PasswordHash = passwordHash,
                PasswordPlainEncrypted = passwordEncrypted,
                IsActive = true,
                RoleId = superAdminRole.Id,
                ForceChangePassword = true, // Force change on first login
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.StaffUsers.Add(superAdminUser);
            await context.SaveChangesAsync();
        }
    }
}

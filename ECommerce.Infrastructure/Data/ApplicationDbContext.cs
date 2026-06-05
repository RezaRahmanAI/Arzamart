using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.Entities;
using ECommerce.Core.Enums;

namespace ECommerce.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }


    public DbSet<Category> Categories { get; set; }
    public DbSet<SubCategory> SubCategories { get; set; }
    public DbSet<Collection> Collections { get; set; }
    public DbSet<Cart> Carts { get; set; }
    public DbSet<CartItem> CartItems { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductVariant> ProductVariants { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<NavigationMenu> NavigationMenus { get; set; }
    public DbSet<HeroBanner> HeroBanners { get; set; }
    public DbSet<Page> Pages { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<SiteSetting> SiteSettings { get; set; }
    public DbSet<DailyTraffic> DailyTraffics { get; set; }
    public DbSet<BlockedIp> BlockedIps { get; set; }
    public DbSet<DeliveryMethod> DeliveryMethods { get; set; }
    public DbSet<OrderNote> OrderNotes { get; set; }
    public DbSet<AppRefreshToken> RefreshTokens { get; set; }
    public DbSet<SourcePage> SourcePages { get; set; }
    public DbSet<SocialMediaSource> SocialMediaSources { get; set; }
    public DbSet<CustomLandingPageConfig> CustomLandingPageConfigs { get; set; }
    public DbSet<ComboItem> ComboItems { get; set; }
    public DbSet<ProductGroup> ProductGroups { get; set; }
    public DbSet<AdminActivityLog> AdminActivityLogs { get; set; }

    public DbSet<StaffUser> StaffUsers { get; set; }
    public DbSet<StaffRole> StaffRoles { get; set; }
    public DbSet<StaffModule> StaffModules { get; set; }
    public DbSet<StaffPermission> StaffPermissions { get; set; }
    public DbSet<StaffRolePermission> StaffRolePermissions { get; set; }
    public DbSet<StaffAuditLog> StaffAuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.HasDefaultSchema("dbo");
        base.OnModelCreating(builder);

        // Staff RBAC configurations
        builder.Entity<StaffUser>(entity =>
        {
            entity.ToTable("staff_users");
            entity.HasKey(u => u.Id);
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(150);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(200);
            entity.Property(u => u.Username).IsRequired().HasMaxLength(100);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.PasswordPlainEncrypted).IsRequired();
            entity.Property(u => u.IsActive).HasDefaultValue(true);
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(u => u.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Username).IsUnique();

            entity.HasOne(u => u.Role)
                .WithMany(r => r.StaffUsers)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(u => u.Creator)
                .WithMany()
                .HasForeignKey(u => u.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // Global query filter for soft delete
            entity.HasQueryFilter(u => u.DeletedAt == null);
        });

        builder.Entity<StaffRole>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Name).IsRequired().HasMaxLength(100);
            entity.Property(r => r.IsSystemRole).HasDefaultValue(false);
            entity.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(r => r.Name).IsUnique();
        });

        builder.Entity<StaffModule>(entity =>
        {
            entity.ToTable("modules");
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Name).IsRequired().HasMaxLength(100);
            entity.Property(m => m.Slug).IsRequired().HasMaxLength(100);

            entity.HasIndex(m => m.Name).IsUnique();
            entity.HasIndex(m => m.Slug).IsUnique();
        });

        builder.Entity<StaffPermission>(entity =>
        {
            entity.ToTable("permissions");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Action).IsRequired().HasMaxLength(50);

            entity.HasIndex(p => new { p.ModuleId, p.Action }).IsUnique();

            entity.HasOne(p => p.Module)
                .WithMany(m => m.Permissions)
                .HasForeignKey(p => p.ModuleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<StaffRolePermission>(entity =>
        {
            entity.ToTable("role_permissions");
            entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });

            entity.HasOne(rp => rp.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(rp => rp.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(rp => rp.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<StaffAuditLog>(entity =>
        {
            entity.ToTable("staff_audit_log");
            entity.HasKey(al => al.Id);
            entity.Property(al => al.Action).IsRequired().HasMaxLength(100);
            entity.Property(al => al.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(al => al.Actor)
                .WithMany()
                .HasForeignKey(al => al.ActorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(al => al.TargetStaff)
                .WithMany()
                .HasForeignKey(al => al.TargetStaffId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Global Query Filters for Soft Delete & Active Status
        builder.Entity<Product>().HasQueryFilter(p => p.IsActive);

        builder.Entity<SubCategory>().HasQueryFilter(sc => sc.IsActive);
        builder.Entity<Collection>().HasQueryFilter(c => c.IsActive);
        builder.Entity<NavigationMenu>().HasQueryFilter(n => n.IsActive);
        builder.Entity<HeroBanner>().HasQueryFilter(h => h.IsActive);
        builder.Entity<SourcePage>().HasQueryFilter(p => p.IsActive);
        builder.Entity<SocialMediaSource>().HasQueryFilter(s => s.IsActive);

        // Required relation filters to avoid warnings when main entities are filtered out
        builder.Entity<CartItem>().HasQueryFilter(ci => ci.Product!.IsActive);
        builder.Entity<OrderItem>().HasQueryFilter(oi => oi.Product!.IsActive);
        builder.Entity<ProductImage>().HasQueryFilter(pi => pi.Product!.IsActive);
        builder.Entity<ProductVariant>().HasQueryFilter(pv => pv.Product!.IsActive);
        builder.Entity<Review>().HasQueryFilter(r => r.Product!.IsActive);
        builder.Entity<ComboItem>().HasQueryFilter(ci => ci.Product!.IsActive);
        builder.Entity<CustomLandingPageConfig>().HasQueryFilter(clp => clp.Product!.IsActive);

        // Delivery Method Configuration
        builder.Entity<DeliveryMethod>(entity =>
        {
            entity.Property(d => d.Cost).HasColumnType("decimal(18,2)");
        });

        // Product Configuration
        builder.Entity<Product>(entity =>
        {
            entity.HasOne(p => p.Collection)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CollectionId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Indexes for Performance
            entity.HasIndex(p => p.Slug).IsUnique();
            entity.HasIndex(p => p.Sku).IsUnique();
            entity.HasIndex(p => p.CategoryId);
            entity.HasIndex(p => p.IsNew);
            entity.HasIndex(p => p.IsFeatured);
            
            // Filtered index for active storefront products
            entity.HasIndex(p => new { p.IsActive, p.CategoryId })
                  .HasFilter("[IsActive] = 1")
                  .HasDatabaseName("IX_Products_Storefront_Active");

            // Additional indexes for common queries
            entity.HasIndex(p => p.StockQuantity);
            entity.HasIndex(p => p.CreatedAt);

            // Constraint
            entity.ToTable(t => t.HasCheckConstraint("CK_Product_Name", "LEN(Name) > 0")); 



            entity.HasOne(p => p.SubCategory)
                  .WithMany(sc => sc.Products)
                  .HasForeignKey(p => p.SubCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.ProductGroup)
                  .WithMany(g => g.Products)
                  .HasForeignKey(p => p.ProductGroupId)
                  .OnDelete(DeleteBehavior.SetNull);
        });



        // Category Configuration
        builder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => c.Slug).IsUnique();
            entity.HasIndex(c => c.ParentId);

            entity.HasOne(c => c.ParentCategory)
                  .WithMany(c => c.ChildCategories)
                  .HasForeignKey(c => c.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // SubCategory Configuration
        builder.Entity<SubCategory>(entity =>
        {
            entity.HasKey(sc => sc.Id);
            entity.HasIndex(sc => sc.Slug).IsUnique();
            entity.HasIndex(sc => sc.CategoryId);

            entity.HasOne(sc => sc.Category)
                  .WithMany(c => c.SubCategories)
                  .HasForeignKey(sc => sc.CategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Product Variant Configuration
        builder.Entity<ProductVariant>(entity =>
        {
            entity.Property(v => v.Price).HasColumnType("decimal(18,2)");
            entity.Property(v => v.CompareAtPrice).HasColumnType("decimal(18,2)");
            entity.Property(v => v.PurchaseRate).HasColumnType("decimal(18,2)");
            
            entity.HasOne(v => v.Product)
                  .WithMany(p => p.Variants)
                  .HasForeignKey(v => v.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(v => v.ProductId);
            entity.HasIndex(v => v.Price);
        });

        builder.Entity<Collection>(entity =>
        {
            entity.HasOne(c => c.SubCategory)
                  .WithMany(sc => sc.Collections)
                  .HasForeignKey(c => c.SubCategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(c => c.Slug);
        });

        builder.Entity<NavigationMenu>(entity =>
        {
            entity.HasOne(m => m.ParentMenu)
                  .WithMany(m => m.ChildMenus)
                  .HasForeignKey(m => m.ParentMenuId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasIndex(m => m.IsActive);
            entity.HasIndex(m => m.DisplayOrder);
        });

        // Order Configuration
        builder.Entity<Order>(entity =>
        {
            entity.Property(o => o.SubTotal).HasColumnType("decimal(18,2)");
            entity.Property(o => o.Tax).HasColumnType("decimal(18,2)");
            entity.Property(o => o.ShippingCost).HasColumnType("decimal(18,2)");
            entity.Property(o => o.Discount).HasColumnType("decimal(18,2)");
            entity.Property(o => o.AdvancePayment).HasColumnType("decimal(18,2)");
            entity.Property(o => o.Total).HasColumnType("decimal(18,2)");
            
            entity.HasMany(o => o.Items)
                  .WithOne(i => i.Order)
                  .HasForeignKey(i => i.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(o => o.Status);
            entity.HasIndex(o => o.CreatedAt);
            entity.HasIndex(o => o.OrderNumber);

            entity.HasMany(o => o.Notes)
                  .WithOne()
                  .HasForeignKey(n => n.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(o => o.SourcePage)
                  .WithMany()
                  .HasForeignKey(o => o.SourcePageId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.SocialMediaSource)
                  .WithMany()
                  .HasForeignKey(o => o.SocialMediaSourceId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<OrderItem>(entity =>
        {
            entity.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
            
            entity.HasOne(i => i.Product)
                  .WithMany()
                  .HasForeignKey(i => i.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(i => i.ProductId);
            entity.HasIndex(i => i.OrderId);
        });

        // Site Settings
        builder.Entity<SiteSetting>(entity =>
        {
            entity.Property(s => s.FreeShippingThreshold).HasColumnType("decimal(18,2)");
            entity.Property(s => s.ShippingCharge).HasColumnType("decimal(18,2)");
        });

        // Customer Configuration
        builder.Entity<Customer>(entity =>
        {
            entity.HasIndex(c => c.Phone).IsUnique();
            entity.HasIndex(c => c.CreatedAt);
        });

        // Cart Configuration
        builder.Entity<Cart>(entity =>
        {
            entity.HasMany(c => c.Items)
                  .WithOne(i => i.Cart)
                  .HasForeignKey(i => i.CartId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(c => c.SessionId);
            entity.Property(c => c.SessionId).HasMaxLength(100);
        });

        // CartItem Configuration
        builder.Entity<CartItem>(entity =>
        {
            entity.HasOne(i => i.Product)
                  .WithMany()
                  .HasForeignKey(i => i.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // UserToken Configuration
        builder.Entity<AppRefreshToken>(entity =>
        {
            entity.HasOne(ut => ut.User)
                  .WithMany("RefreshTokens")
                  .HasForeignKey(ut => ut.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(ut => ut.RefreshToken);
            entity.HasIndex(ut => ut.UserId);
        });

        // ApplicationUser Configuration
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.HasIndex(u => u.Phone).IsUnique().HasFilter("[Phone] IS NOT NULL");
            entity.Property(u => u.Phone).HasMaxLength(20);
            entity.Property(u => u.Role).HasMaxLength(20).IsRequired();
            
            entity.Property(u => u.Email).IsRequired(false);
            entity.Property(u => u.UserName).IsRequired(false);
            entity.Property(u => u.PasswordHash).IsRequired(false);

            entity.Property(u => u.IsSuspicious).HasDefaultValue(false);
            entity.Property(u => u.IsActive).HasDefaultValue(true);
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        builder.Entity<CustomLandingPageConfig>(entity =>
        {
            entity.Property(c => c.PromoPrice).HasColumnType("decimal(18,2)");
            entity.Property(c => c.OriginalPrice).HasColumnType("decimal(18,2)");

            entity.HasOne(c => c.Product)
                .WithMany()
                .HasForeignKey(c => c.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Review>(entity =>
        {
            entity.HasOne(r => r.Product)
                .WithMany(p => p.Reviews)
                .HasForeignKey(r => r.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ComboItem Configuration
        builder.Entity<ComboItem>(entity =>
        {
            entity.HasOne(ci => ci.ComboProduct)
                  .WithMany(p => p.ComboItems)
                  .HasForeignKey(ci => ci.ComboProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ci => ci.Product)
                  .WithMany()
                  .HasForeignKey(ci => ci.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ci => ci.ProductVariant)
                  .WithMany()
                  .HasForeignKey(ci => ci.ProductVariantId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AdminActivityLog Configuration
        builder.Entity<AdminActivityLog>(entity =>
        {
            entity.HasIndex(a => a.UserId);
            entity.HasIndex(a => a.CreatedAt);
            entity.HasIndex(a => a.Action);
            
            entity.HasOne(a => a.User)
                  .WithMany()
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(a => a.PerformedBy)
                  .WithMany()
                  .HasForeignKey(a => a.PerformedByUserId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

    }
}

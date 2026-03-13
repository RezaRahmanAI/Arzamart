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
    public DbSet<BlogPost> BlogPosts { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<SiteSetting> SiteSettings { get; set; }
    public DbSet<DailyTraffic> DailyTraffics { get; set; }
    public DbSet<BlockedIp> BlockedIps { get; set; }
    public DbSet<DeliveryMethod> DeliveryMethods { get; set; }
    public DbSet<AppRefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Enforce standard professional schema prefix
        builder.HasDefaultSchema("dbo");

        // Delivery Method Configuration
        builder.Entity<DeliveryMethod>(entity =>
        {
            entity.Property(d => d.Cost).HasColumnType("decimal(18,2)");
        });

        // Product Configuration
        builder.Entity<Product>(entity =>
        {
            
            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.SubCategory)
                  .WithMany(sc => sc.Products)
                  .HasForeignKey(p => p.SubCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

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

            // Full-Text Search (Requires Full-Text Search enabled on SQL Server)
            // Note: EF Core 8 supports this via .HasFullTextIndex()
            entity.ToTable(t => t.HasCheckConstraint("CK_Product_Name", "LEN(Name) > 0")); 
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

            // Performance index
            entity.HasIndex(v => v.ProductId);
            entity.HasIndex(v => v.Price); // Added for filtering/sorting by price
        });

        // Category Self-Referencing Hierarchy
        builder.Entity<Category>(entity =>
        {
            entity.HasOne(c => c.Parent)
                  .WithMany(c => c.ChildCategories)
                  .HasForeignKey(c => c.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasIndex(c => c.Slug);
        });

        // Category Hierarchy
        builder.Entity<SubCategory>(entity =>
        {
            entity.HasOne(sc => sc.Category)
                  .WithMany(c => c.SubCategories)
                  .HasForeignKey(sc => sc.CategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(sc => sc.Slug);
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
            entity.Property(o => o.Total).HasColumnType("decimal(18,2)");
            
            entity.HasMany(o => o.Items)
                  .WithOne(i => i.Order)
                  .HasForeignKey(i => i.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Performance indexes
            entity.HasIndex(o => o.Status);
            entity.HasIndex(o => o.CreatedAt);
            entity.HasIndex(o => o.OrderNumber);
        });

        builder.Entity<OrderItem>(entity =>
        {
            entity.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
            
            entity.HasOne(i => i.Product)
                  .WithMany()
                  .HasForeignKey(i => i.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Performance index for aggregations
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
        builder.Entity<Cart>()
            .HasMany(c => c.Items)
            .WithOne(i => i.Cart)
            .HasForeignKey(i => i.CartId)
            .OnDelete(DeleteBehavior.Cascade);

        // CartItem Configuration
        builder.Entity<CartItem>()
            .HasOne(i => i.Product)
            .WithMany()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

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
            
            // Ensure Email, UserName and PasswordHash are not required by EF
            entity.Property(u => u.Email).IsRequired(false);
            entity.Property(u => u.UserName).IsRequired(false);
            entity.Property(u => u.PasswordHash).IsRequired(false);

            // Configure SQL Default Values
            entity.Property(u => u.IsSuspicious).HasDefaultValue(false);
            entity.Property(u => u.IsActive).HasDefaultValue(true);
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // Cart Configuration Update
        builder.Entity<Cart>(entity =>
        {
            entity.HasIndex(c => c.SessionId);
            entity.Property(c => c.SessionId).HasMaxLength(100);
        });
    }
}

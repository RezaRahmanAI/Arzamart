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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.HasDefaultSchema("dbo");
        base.OnModelCreating(builder);
        
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
        });



        // SubCategory Configuration
        builder.Entity<SubCategory>(entity =>
        {
            entity.HasKey(sc => sc.Id);
            entity.HasIndex(sc => sc.Slug).IsUnique();
            entity.HasIndex(sc => sc.CategoryId);


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
                .WithMany()
                .HasForeignKey(r => r.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

    }
}

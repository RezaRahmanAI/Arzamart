using System;
using Microsoft.AspNetCore.Identity;
using ECommerce.Core.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext context)
    {
        // Ensure database is up to date for recent schema changes (AdminNote fix)
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.columns 
                               WHERE object_id = OBJECT_ID(N'[dbo].[Orders]') 
                               AND name = 'AdminNote')
                BEGIN
                    ALTER TABLE [dbo].[Orders] ADD [AdminNote] NVARCHAR(MAX) NULL
                END");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB_FIX] Error ensuring AdminNote column: {ex.Message}");
        }

        if (!await roleManager.RoleExistsAsync("SuperAdmin"))
        {
            await roleManager.CreateAsync(new IdentityRole("SuperAdmin"));
        }

        if (!await roleManager.RoleExistsAsync("Admin"))
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
        }

        if (!await roleManager.RoleExistsAsync("User"))
        {
            await roleManager.CreateAsync(new IdentityRole("User"));
        }

        // Ensure Primary Admin User exists
        var primaryAdminEmail = "admin@arzamart.com";
        var existingAdmin = await userManager.FindByEmailAsync(primaryAdminEmail);

        if (existingAdmin == null)
        {
            var newAdmin = new ApplicationUser
            {
                UserName = primaryAdminEmail,
                Email = primaryAdminEmail,
                FullName = "System Admin",
                EmailConfirmed = true,
                Role = "Admin"
            };

            var result = await userManager.CreateAsync(newAdmin, "Admin@1234");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(newAdmin, "Admin");
                await userManager.AddToRoleAsync(newAdmin, "SuperAdmin");
            }
        }
        else if (existingAdmin.Role != "SuperAdmin")
        {
            existingAdmin.Role = "SuperAdmin";
            await userManager.UpdateAsync(existingAdmin);
            
            if (!await userManager.IsInRoleAsync(existingAdmin, "Admin"))
            {
                await userManager.AddToRoleAsync(existingAdmin, "Admin");
            }

            if (!await userManager.IsInRoleAsync(existingAdmin, "SuperAdmin"))
            {
                await userManager.AddToRoleAsync(existingAdmin, "SuperAdmin");
            }
        }

        // Also ensure the old test admin exists for backwards compatibility if needed
        if (await userManager.FindByEmailAsync("admin@gmail.com") == null)
        {
            var adminUser = new ApplicationUser
            {
                UserName = "admin@gmail.com",
                Email = "admin@gmail.com",
                FullName = "Admin User",
                EmailConfirmed = true,
                Role = "Admin"
            };

            var result = await userManager.CreateAsync(adminUser, "Admin123");

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "SuperAdmin");
            }
        }
        else 
        {
            var adminUser = await userManager.FindByEmailAsync("admin@gmail.com");
            if (adminUser != null && adminUser.Role != "SuperAdmin")
            {
                adminUser.Role = "SuperAdmin";
                await userManager.UpdateAsync(adminUser);
                if (!await userManager.IsInRoleAsync(adminUser, "SuperAdmin"))
                {
                    await userManager.AddToRoleAsync(adminUser, "SuperAdmin");
                }
            }
        }

        // Seed/Update Categories and SubCategories
        var categoriesToSeed = new List<Category>
        {
            new Category
            {
                Name = "Men",
                Slug = "men",
                ImageUrl = "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59",
                DisplayOrder = 1,
                IsActive = true,
                SubCategories = new List<SubCategory>
                {
                    new SubCategory { Name = "Sherwani", Slug = "sherwani", ImageUrl = "https://images.unsplash.com/photo-1594938298603-c8148c4dae35", IsActive = true },
                    new SubCategory { Name = "Thobe", Slug = "thobe", ImageUrl = "https://images.unsplash.com/photo-1583939003579-730e3918a45a", IsActive = true },
                    new SubCategory { Name = "Kabli", Slug = "kabli", ImageUrl = "https://images.unsplash.com/photo-1594938291221-94f18cbb5660", IsActive = true },
                    new SubCategory { Name = "Panjabi", Slug = "panjabi", ImageUrl = "https://images.unsplash.com/photo-1621510456681-233013d82a13", IsActive = true }
                }
            },
            new Category
            {
                Name = "Women",
                Slug = "women",
                ImageUrl = "https://images.unsplash.com/photo-1483985988355-763728e1935b",
                DisplayOrder = 2,
                IsActive = true,
                SubCategories = new List<SubCategory>
                {
                    new SubCategory { Name = "Abaya", Slug = "abaya", ImageUrl = "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb", IsActive = true },
                    new SubCategory { Name = "Tops", Slug = "tops", ImageUrl = "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3", IsActive = true },
                    new SubCategory { Name = "Co-ords Dress Set", Slug = "coords", ImageUrl = "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3", IsActive = true },
                    new SubCategory { Name = "Scarf", Slug = "scarf", ImageUrl = "https://images.unsplash.com/photo-1601924582970-84472305206c", IsActive = true }
                }
            },
            new Category
            {
                Name = "Kids",
                Slug = "kids",
                ImageUrl = "https://images.unsplash.com/photo-1514090458221-65bb69af63e6",
                DisplayOrder = 3,
                IsActive = true,
                SubCategories = new List<SubCategory>
                {
                    new SubCategory { Name = "Girls", Slug = "girls", ImageUrl = "https://images.unsplash.com/photo-1518837697477-94d4777248d6", IsActive = true },
                    new SubCategory { Name = "Boys", Slug = "boys", ImageUrl = "https://images.unsplash.com/photo-1503910392345-1593b4ff3af1", IsActive = true },
                    new SubCategory { Name = "Mother & Daughter", Slug = "mother-daughter", ImageUrl = "https://images.unsplash.com/photo-1518837697477-94d4777248d6", IsActive = true },
                    new SubCategory { Name = "Father & Son", Slug = "father-son", ImageUrl = "https://images.unsplash.com/photo-1513159446162-54eb8bdf79b5", IsActive = true }
                }
            },
            new Category
            {
                Name = "Accessories",
                Slug = "accessories",
                ImageUrl = "https://images.unsplash.com/photo-1491336477066-31156b5e4f35",
                DisplayOrder = 4,
                IsActive = true,
                SubCategories = new List<SubCategory>
                {
                    new SubCategory { Name = "Bags", Slug = "bags", ImageUrl = "https://images.unsplash.com/photo-1584917865442-de89df76afd3", IsActive = true },
                    new SubCategory { Name = "Home Decor", Slug = "home-decor", ImageUrl = "https://images.unsplash.com/photo-1513519245088-0e12902e5a38", IsActive = true },
                    new SubCategory { Name = "Watches", Slug = "watches", ImageUrl = "https://images.unsplash.com/photo-1524592094714-0f0654e20314", IsActive = true },
                    new SubCategory { Name = "Wallets", Slug = "wallets", ImageUrl = "https://images.unsplash.com/photo-1627123424574-724758594e93", IsActive = true }
                }
            }
        };

        foreach (var cat in categoriesToSeed)
        {
            var existingCat = await context.Categories
                .Include(c => c.SubCategories)
                .FirstOrDefaultAsync(c => c.Slug == cat.Slug);

            if (existingCat == null)
            {
                await context.Categories.AddAsync(cat);
            }
            else
            {
                // Update existing category
                existingCat.Name = cat.Name;
                existingCat.ImageUrl = cat.ImageUrl;
                existingCat.DisplayOrder = cat.DisplayOrder;
                existingCat.IsActive = true;

                // Update/Add Subcategories
                foreach (var sub in cat.SubCategories)
                {
                    var existingSub = existingCat.SubCategories.FirstOrDefault(s => s.Slug == sub.Slug);
                    if (existingSub == null)
                    {
                        sub.CategoryId = existingCat.Id;
                        await context.SubCategories.AddAsync(sub);
                    }
                    else
                    {
                        existingSub.Name = sub.Name;
                        existingSub.ImageUrl = sub.ImageUrl;
                        existingSub.IsActive = true;
                    }
                }
            }
        }
        await context.SaveChangesAsync();

        // Seed Products - Only if empty
        var productCount = await context.Products.CountAsync();

        if (productCount == 0)
        {
            var categories = await context.Categories.Include(c => c.SubCategories).ToListAsync();
            var productsToAdd = new List<Product>();

            // Helper function to find subcategory
            SubCategory? FindSubCategory(string catSlug, string subSlug)
            {
                return categories.FirstOrDefault(c => c.Slug == catSlug)?
                    .SubCategories.FirstOrDefault(s => s.Slug == subSlug);
            }

            // ── Men's Sherwani ──────────────────────────────────────────
            var menCat = categories.FirstOrDefault(c => c.Slug == "men");
            var sherwaniSub = FindSubCategory("men", "sherwani");
            if (menCat != null && sherwaniSub != null)
            {
                productsToAdd.AddRange(new[]
                {
                    new Product
                    {
                        Name = "Royal Embroidered Sherwani - Ivory",
                        Slug = "royal-embroidered-sherwani-ivory",
                        Sku = "MEN-SHR-001",
                        ShortDescription = "Exquisite ivory sherwani with intricate golden embroidery",
                        Description = "Make a grand statement with this regal ivory sherwani featuring hand-embroidered golden threadwork. Perfect for weddings and special occasions, this piece combines traditional craftsmanship with contemporary elegance.",

                        CategoryId = menCat.Id, SubCategoryId = sherwaniSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
                        StockQuantity = 38, IsActive = true, IsNew = true,
                        Tags = "Men, Sherwani, Wedding, Formal, Luxury", Tier = "Luxury",
                        FabricAndCare = "100% Pure Silk. Dry clean only.",
                        ShippingAndReturns = "Free shipping on orders over ৳5000. Returns within 7 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800", AltText = "Royal Embroidered Sherwani Ivory Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=800", AltText = "Royal Embroidered Sherwani Ivory Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800", AltText = "Royal Embroidered Sherwani Black Variant", Label = "Black Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "S", StockQuantity = 8, IsActive = true, Sku = "MEN-SHR-001-S", Price = 15500, CompareAtPrice = 18500, PurchaseRate = 9500 },
                            new ProductVariant { Size = "M", StockQuantity = 12, IsActive = true, Sku = "MEN-SHR-001-M", Price = 15500, CompareAtPrice = 18500, PurchaseRate = 9500 },
                            new ProductVariant { Size = "L", StockQuantity = 10, IsActive = true, Sku = "MEN-SHR-001-L", Price = 15500, CompareAtPrice = 18500, PurchaseRate = 9500 },
                            new ProductVariant { Size = "XL", StockQuantity = 8, IsActive = true, Sku = "MEN-SHR-001-XL", Price = 15500, CompareAtPrice = 18500, PurchaseRate = 9500 }
                        }
                    },
                    new Product
                    {
                        Name = "Classic Black Velvet Sherwani",
                        Slug = "classic-black-velvet-sherwani",
                        Sku = "MEN-SHR-002",
                        ShortDescription = "Luxurious black velvet sherwani with silver detailing",
                        Description = "Elevate your formal wardrobe with this stunning black velvet sherwani adorned with silver embellishments. Crafted for the modern gentleman who appreciates timeless style.",

                        CategoryId = menCat.Id, SubCategoryId = sherwaniSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800",
                        StockQuantity = 35, IsActive = true, IsNew = false,
                        Tags = "Men, Sherwani, Velvet, Premium", Tier = "Premium",
                        FabricAndCare = "Premium velvet fabric. Dry clean only.",
                        ShippingAndReturns = "Free shipping on orders over ৳5000. Returns within 7 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800", AltText = "Classic Black Velvet Sherwani Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800", AltText = "Classic Black Velvet Sherwani Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=800", AltText = "Classic Sherwani Navy Variant", Label = "Navy Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "S", StockQuantity = 7, IsActive = true, Sku = "MEN-SHR-002-S", Price = 12500, CompareAtPrice = 15000, PurchaseRate = 8000 },
                            new ProductVariant { Size = "M", StockQuantity = 10, IsActive = true, Sku = "MEN-SHR-002-M", Price = 12500, CompareAtPrice = 15000, PurchaseRate = 8000 },
                            new ProductVariant { Size = "L", StockQuantity = 12, IsActive = true, Sku = "MEN-SHR-002-L", Price = 12500, CompareAtPrice = 15000, PurchaseRate = 8000 },
                            new ProductVariant { Size = "XL", StockQuantity = 6, IsActive = true, Sku = "MEN-SHR-002-XL", Price = 12500, CompareAtPrice = 15000, PurchaseRate = 8000 }
                        }
                    },
                    new Product
                    {
                        Name = "Maroon Silk Sherwani Set",
                        Slug = "maroon-silk-sherwani-set",
                        Sku = "MEN-SHR-003",
                        ShortDescription = "Rich maroon silk sherwani with matching stole",
                        Description = "This luxurious maroon silk sherwani comes with a complementing stole, perfect for groom's attire. The rich color and premium fabric make it ideal for wedding ceremonies.",

                        CategoryId = menCat.Id, SubCategoryId = sherwaniSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=800",
                        StockQuantity = 30, IsActive = true, IsNew = true,
                        Tags = "Men, Sherwani, Silk, Wedding", Tier = "Luxury",
                        FabricAndCare = "Pure silk with hand embroidery. Dry clean only.",
                        ShippingAndReturns = "Free shipping. Returns within 7 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=800", AltText = "Maroon Silk Sherwani Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800", AltText = "Maroon Silk Sherwani with Stole", Label = "With Stole", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800", AltText = "Maroon Silk Sherwani Cream Variant", Label = "Cream Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "S", StockQuantity = 6, IsActive = true, Sku = "MEN-SHR-003-S", Price = 14000, CompareAtPrice = 16500, PurchaseRate = 9000 },
                            new ProductVariant { Size = "M", StockQuantity = 10, IsActive = true, Sku = "MEN-SHR-003-M", Price = 14000, CompareAtPrice = 16500, PurchaseRate = 9000 },
                            new ProductVariant { Size = "L", StockQuantity = 9, IsActive = true, Sku = "MEN-SHR-003-L", Price = 14000, CompareAtPrice = 16500, PurchaseRate = 9000 },
                            new ProductVariant { Size = "XL", StockQuantity = 5, IsActive = true, Sku = "MEN-SHR-003-XL", Price = 14000, CompareAtPrice = 16500, PurchaseRate = 9000 }
                        }
                    },
                    new Product
                    {
                        Name = "Cream Embellished Sherwani",
                        Slug = "cream-embellished-sherwani",
                        Sku = "MEN-SHR-004",
                        ShortDescription = "Elegant cream sherwani with pearl and stone work",
                        Description = "A masterpiece of traditional artisanship, this cream sherwani features delicate pearl and stone embellishments that catch the light beautifully.",

                        CategoryId = menCat.Id, SubCategoryId = sherwaniSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800",
                        StockQuantity = 32, IsActive = true, IsNew = false,
                        Tags = "Men, Sherwani, Formal, Elegant", Tier = "Premium",
                        FabricAndCare = "Embellished fabric. Dry clean only. Handle with care.",
                        ShippingAndReturns = "Free shipping. Returns within 7 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800", AltText = "Cream Embellished Sherwani Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800", AltText = "Cream Embellished Sherwani Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=800", AltText = "Cream Embellished Sherwani Gold Variant", Label = "Gold Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "S", StockQuantity = 8, IsActive = true, Sku = "MEN-SHR-004-S", Price = 13500, CompareAtPrice = 16000, PurchaseRate = 8500 },
                            new ProductVariant { Size = "M", StockQuantity = 10, IsActive = true, Sku = "MEN-SHR-004-M", Price = 13500, CompareAtPrice = 16000, PurchaseRate = 8500 },
                            new ProductVariant { Size = "L", StockQuantity = 9, IsActive = true, Sku = "MEN-SHR-004-L", Price = 13500, CompareAtPrice = 16000, PurchaseRate = 8500 },
                            new ProductVariant { Size = "XL", StockQuantity = 5, IsActive = true, Sku = "MEN-SHR-004-XL", Price = 13500, CompareAtPrice = 16000, PurchaseRate = 8500 }
                        }
                    }
                });
            }

            // Men's Panjabi (3 products)
            var panjabiSub = FindSubCategory("men", "panjabi");
            if (menCat != null && panjabiSub != null)
            {
                productsToAdd.AddRange(new[]
                {
                    new Product
                    {
                        Name = "Premium Cotton Panjabi - White",
                        Slug = "premium-cotton-panjabi-white",
                        Sku = "MEN-PAN-001",
                        ShortDescription = "Comfortable white cotton panjabi for everyday wear",
                        Description = "Stay comfortable and stylish with this premium quality white cotton panjabi. Perfect for casual occasions, religious gatherings, and daily wear.",

                        CategoryId = menCat.Id, SubCategoryId = panjabiSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1621510456681-233013d82a13?w=800",
                        StockQuantity = 80, IsActive = true, IsNew = false,
                        Tags = "Men, Panjabi, Cotton, Casual", Tier = "Premium",
                        FabricAndCare = "100% cotton. Machine wash cold. Do not bleach.",
                        ShippingAndReturns = "Free shipping on orders over ৳2000. Returns within 14 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1621510456681-233013d82a13?w=800", AltText = "Premium Cotton Panjabi White Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800", AltText = "Premium Cotton Panjabi White Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800", AltText = "Premium Cotton Panjabi Black Variant", Label = "Black Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "S", StockQuantity = 15, IsActive = true, Sku = "MEN-PAN-001-S", Price = 2800, CompareAtPrice = 3500, PurchaseRate = 1800 },
                            new ProductVariant { Size = "M", StockQuantity = 25, IsActive = true, Sku = "MEN-PAN-001-M", Price = 2800, CompareAtPrice = 3500, PurchaseRate = 1800 },
                            new ProductVariant { Size = "L", StockQuantity = 25, IsActive = true, Sku = "MEN-PAN-001-L", Price = 2800, CompareAtPrice = 3500, PurchaseRate = 1800 },
                            new ProductVariant { Size = "XL", StockQuantity = 15, IsActive = true, Sku = "MEN-PAN-001-XL", Price = 2800, CompareAtPrice = 3500, PurchaseRate = 1800 }
                        }
                    },
                    new Product
                    {
                        Name = "Designer Panjabi - Blue Print",
                        Slug = "designer-panjabi-blue-print",
                        Sku = "MEN-PAN-002",
                        ShortDescription = "Stylish blue printed panjabi with modern design",
                        Description = "Stand out with this contemporary blue printed panjabi featuring unique patterns. Made from breathable fabric, it's perfect for festive occasions.",

                        CategoryId = menCat.Id, SubCategoryId = panjabiSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1621510456681-233013d82a13?w=800",
                        StockQuantity = 55, IsActive = true, IsNew = true,
                        Tags = "Men, Panjabi, Designer, Festive", Tier = "Premium",
                        FabricAndCare = "Cotton blend. Machine wash cold.",
                        ShippingAndReturns = "Free shipping on orders over ৳2000. Returns within 14 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1621510456681-233013d82a13?w=800", AltText = "Designer Panjabi Blue Print Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800", AltText = "Designer Panjabi Print Detail", Label = "Print Detail", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800", AltText = "Designer Panjabi Green Variant", Label = "Green Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "S", StockQuantity = 10, IsActive = true, Sku = "MEN-PAN-002-S", Price = 3200, CompareAtPrice = 4000, PurchaseRate = 2200 },
                            new ProductVariant { Size = "M", StockQuantity = 18, IsActive = true, Sku = "MEN-PAN-002-M", Price = 3200, CompareAtPrice = 4000, PurchaseRate = 2200 },
                            new ProductVariant { Size = "L", StockQuantity = 17, IsActive = true, Sku = "MEN-PAN-002-L", Price = 3200, CompareAtPrice = 4000, PurchaseRate = 2200 },
                            new ProductVariant { Size = "XL", StockQuantity = 10, IsActive = true, Sku = "MEN-PAN-002-XL", Price = 3200, CompareAtPrice = 4000, PurchaseRate = 2200 }
                        }
                    },
                    new Product
                    {
                        Name = "Traditional Panjabi - Beige",
                        Slug = "traditional-panjabi-beige",
                        Sku = "MEN-PAN-003",
                        ShortDescription = "Classic beige panjabi with subtle embroidery",
                        Description = "Embrace tradition with this elegant beige panjabi featuring subtle embroidery on the collar and sleeves. A versatile addition to your wardrobe.",

                        CategoryId = menCat.Id, SubCategoryId = panjabiSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800",
                        StockQuantity = 60, IsActive = true, IsNew = false,
                        Tags = "Men, Panjabi, Traditional, Embroidered", Tier = "Premium",
                        FabricAndCare = "Cotton with embroidery. Hand wash recommended.",
                        ShippingAndReturns = "Free shipping on orders over ৳2000. Returns within 14 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800", AltText = "Traditional Panjabi Beige Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1621510456681-233013d82a13?w=800", AltText = "Traditional Panjabi Beige Embroidery", Label = "Embroidery Detail", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800", AltText = "Traditional Panjabi Grey Variant", Label = "Grey Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "S", StockQuantity = 12, IsActive = true, Sku = "MEN-PAN-003-S", Price = 2500, CompareAtPrice = 3000, PurchaseRate = 1600 },
                            new ProductVariant { Size = "M", StockQuantity = 20, IsActive = true, Sku = "MEN-PAN-003-M", Price = 2500, CompareAtPrice = 3000, PurchaseRate = 1600 },
                            new ProductVariant { Size = "L", StockQuantity = 18, IsActive = true, Sku = "MEN-PAN-003-L", Price = 2500, CompareAtPrice = 3000, PurchaseRate = 1600 },
                            new ProductVariant { Size = "XL", StockQuantity = 10, IsActive = true, Sku = "MEN-PAN-003-XL", Price = 2500, CompareAtPrice = 3000, PurchaseRate = 1600 }
                        }
                    }
                });
            }

            // Women's Abaya (4 products)
            // Women's Abaya (4 products)
            var womenCat = categories.FirstOrDefault(c => c.Slug == "women");
            var abayaSub = FindSubCategory("women", "abaya");
            if (womenCat != null && abayaSub != null)
            {
                productsToAdd.AddRange(new[]
                {
                    new Product
                    {
                        Name = "Elegant Black Abaya with Lace Detailing",
                        Slug = "elegant-black-abaya-lace",
                        Sku = "WOM-ABA-001",
                        ShortDescription = "Sophisticated black abaya with delicate lace trim",
                        Description = "This elegant black abaya features beautiful lace detailing along the edges, combining modesty with modern sophistication.",

                        CategoryId = womenCat.Id, SubCategoryId = abayaSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800",
                        StockQuantity = 44, IsActive = true, IsNew = true,
                        Tags = "Women, Abaya, Modest, Elegant", Tier = "Premium",
                        FabricAndCare = "Premium chiffon. Hand wash cold.",
                        ShippingAndReturns = "Free shipping. Returns within 7 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800", AltText = "Elegant Black Abaya Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800", AltText = "Elegant Black Abaya Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800", AltText = "Elegant Abaya Navy Variant", Label = "Navy Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "S", StockQuantity = 10, IsActive = true, Sku = "WOM-ABA-001-S", Price = 4500, CompareAtPrice = 5500, PurchaseRate = 2800 },
                            new ProductVariant { Size = "M", StockQuantity = 14, IsActive = true, Sku = "WOM-ABA-001-M", Price = 4500, CompareAtPrice = 5500, PurchaseRate = 2800 },
                            new ProductVariant { Size = "L", StockQuantity = 12, IsActive = true, Sku = "WOM-ABA-001-L", Price = 4500, CompareAtPrice = 5500, PurchaseRate = 2800 },
                            new ProductVariant { Size = "XL", StockQuantity = 8, IsActive = true, Sku = "WOM-ABA-001-XL", Price = 4500, CompareAtPrice = 5500, PurchaseRate = 2800 }
                        }
                    },
                    new Product
                    {
                        Name = "Navy Blue Embroidered Abaya",
                        Slug = "navy-blue-embroidered-abaya",
                        Sku = "WOM-ABA-002",
                        ShortDescription = "Stunning navy blue abaya with gold embroidery",
                        Description = "Make a statement with this gorgeous navy blue abaya adorned with golden embroidery. Perfect for special occasions.",

                        CategoryId = womenCat.Id, SubCategoryId = abayaSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
                        StockQuantity = 38, IsActive = true, IsNew = false,
                        Tags = "Women, Abaya, Embroidered, Premium", Tier = "Luxury",
                        FabricAndCare = "Silk blend. Dry clean only.",
                        ShippingAndReturns = "Free shipping. Returns within 7 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800", AltText = "Navy Blue Embroidered Abaya Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800", AltText = "Navy Blue Embroidered Abaya Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1601924582970-84472305206c?w=800", AltText = "Abaya Black Variant", Label = "Black Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "S", StockQuantity = 8, IsActive = true, Sku = "WOM-ABA-002-S", Price = 6500, CompareAtPrice = 7500, PurchaseRate = 4200 },
                            new ProductVariant { Size = "M", StockQuantity = 12, IsActive = true, Sku = "WOM-ABA-002-M", Price = 6500, CompareAtPrice = 7500, PurchaseRate = 4200 },
                            new ProductVariant { Size = "L", StockQuantity = 12, IsActive = true, Sku = "WOM-ABA-002-L", Price = 6500, CompareAtPrice = 7500, PurchaseRate = 4200 },
                            new ProductVariant { Size = "XL", StockQuantity = 6, IsActive = true, Sku = "WOM-ABA-002-XL", Price = 6500, CompareAtPrice = 7500, PurchaseRate = 4200 }
                        }
                    },
                    new Product
                    {
                        Name = "Simple Everyday Abaya - Grey",
                        Slug = "simple-everyday-abaya-grey",
                        Sku = "WOM-ABA-003",
                        ShortDescription = "Comfortable grey abaya for daily wear",
                        Description = "A versatile and comfortable grey abaya perfect for everyday use. Made from breathable fabric with a simple, elegant design.",

                        CategoryId = womenCat.Id, SubCategoryId = abayaSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1601924582970-84472305206c?w=800",
                        StockQuantity = 60, IsActive = true, IsNew = false,
                        Tags = "Women, Abaya, Casual, Comfortable", Tier = "Premium",
                        FabricAndCare = "Cotton blend. Machine wash cold.",
                        ShippingAndReturns = "Free shipping. Returns within 14 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1601924582970-84472305206c?w=800", AltText = "Simple Everyday Abaya Grey Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800", AltText = "Simple Everyday Abaya Grey Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800", AltText = "Simple Abaya Black Variant", Label = "Black Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "S", StockQuantity = 12, IsActive = true, Sku = "WOM-ABA-003-S", Price = 3800, CompareAtPrice = 4500, PurchaseRate = 2400 },
                            new ProductVariant { Size = "M", StockQuantity = 18, IsActive = true, Sku = "WOM-ABA-003-M", Price = 3800, CompareAtPrice = 4500, PurchaseRate = 2400 },
                            new ProductVariant { Size = "L", StockQuantity = 18, IsActive = true, Sku = "WOM-ABA-003-L", Price = 3800, CompareAtPrice = 4500, PurchaseRate = 2400 },
                            new ProductVariant { Size = "XL", StockQuantity = 12, IsActive = true, Sku = "WOM-ABA-003-XL", Price = 3800, CompareAtPrice = 4500, PurchaseRate = 2400 }
                        }
                    },
                    new Product
                    {
                        Name = "Luxury Burgundy Abaya with Belt",
                        Slug = "luxury-burgundy-abaya-belt",
                        Sku = "WOM-ABA-004",
                        ShortDescription = "Premium burgundy abaya with matching belt",
                        Description = "Indulge in luxury with this beautiful burgundy abaya that comes with a matching belt for a flattering silhouette.",

                        CategoryId = womenCat.Id, SubCategoryId = abayaSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
                        StockQuantity = 32, IsActive = true, IsNew = true,
                        Tags = "Women, Abaya, Luxury, Premium", Tier = "Luxury",
                        FabricAndCare = "Premium crepe. Dry clean only.",
                        ShippingAndReturns = "Free shipping. Returns within 7 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800", AltText = "Luxury Burgundy Abaya Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800", AltText = "Luxury Burgundy Abaya Belt Detail", Label = "Belt Detail", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1601924582970-84472305206c?w=800", AltText = "Luxury Abaya Emerald Variant", Label = "Emerald Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "S", StockQuantity = 7, IsActive = true, Sku = "WOM-ABA-004-S", Price = 7500, CompareAtPrice = 9000, PurchaseRate = 4800 },
                            new ProductVariant { Size = "M", StockQuantity = 10, IsActive = true, Sku = "WOM-ABA-004-M", Price = 7500, CompareAtPrice = 9000, PurchaseRate = 4800 },
                            new ProductVariant { Size = "L", StockQuantity = 10, IsActive = true, Sku = "WOM-ABA-004-L", Price = 7500, CompareAtPrice = 9000, PurchaseRate = 4800 },
                            new ProductVariant { Size = "XL", StockQuantity = 5, IsActive = true, Sku = "WOM-ABA-004-XL", Price = 7500, CompareAtPrice = 9000, PurchaseRate = 4800 }
                        }
                    }
                });
            }

            // Women's Tops (3 products)
            var topsSub = FindSubCategory("women", "tops");
            if (womenCat != null && topsSub != null)
            {
                productsToAdd.AddRange(new[]
                {
                    new Product
                    {
                        Name = "Floral Print Summer Top",
                        Slug = "floral-print-summer-top",
                        Sku = "WOM-TOP-001",
                        ShortDescription = "Light and breezy floral top for summer",
                        Description = "Beat the heat in style with this beautiful floral print summer top. Made from lightweight, breathable fabric perfect for warm weather.",

                        CategoryId = womenCat.Id, SubCategoryId = topsSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800",
                        StockQuantity = 60, IsActive = true, IsNew = true,
                        Tags = "Women, Tops, Floral, Summer", Tier = "Premium",
                        FabricAndCare = "100% cotton. Machine wash cold.",
                        ShippingAndReturns = "Free shipping on orders over ৳2000. Returns within 14 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800", AltText = "Floral Print Summer Top Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800", AltText = "Floral Print Summer Top Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800", AltText = "Floral Top Blue Variant", Label = "Blue Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "XS", StockQuantity = 10, IsActive = true, Sku = "WOM-TOP-001-XS", Price = 1800, CompareAtPrice = 2500, PurchaseRate = 1200 },
                            new ProductVariant { Size = "S", StockQuantity = 15, IsActive = true, Sku = "WOM-TOP-001-S", Price = 1800, CompareAtPrice = 2500, PurchaseRate = 1200 },
                            new ProductVariant { Size = "M", StockQuantity = 20, IsActive = true, Sku = "WOM-TOP-001-M", Price = 1800, CompareAtPrice = 2500, PurchaseRate = 1200 },
                            new ProductVariant { Size = "L", StockQuantity = 15, IsActive = true, Sku = "WOM-TOP-001-L", Price = 1800, CompareAtPrice = 2500, PurchaseRate = 1200 }
                        }
                    },
                    new Product
                    {
                        Name = "Elegant Silk Blouse - Emerald",
                        Slug = "elegant-silk-blouse-emerald",
                        Sku = "WOM-TOP-002",
                        ShortDescription = "Luxurious emerald green silk blouse",
                        Description = "Elevate your wardrobe with this stunning emerald silk blouse. Perfect for both professional and evening occasions.",

                        CategoryId = womenCat.Id, SubCategoryId = topsSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
                        StockQuantity = 42, IsActive = true, IsNew = false,
                        Tags = "Women, Tops, Silk, Luxury", Tier = "Luxury",
                        FabricAndCare = "100% silk. Dry clean only.",
                        ShippingAndReturns = "Free shipping. Returns within 7 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800", AltText = "Elegant Silk Blouse Emerald Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800", AltText = "Elegant Silk Blouse Emerald Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1601924582970-84472305206c?w=800", AltText = "Silk Blouse Ivory Variant", Label = "Ivory Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "XS", StockQuantity = 8, IsActive = true, Sku = "WOM-TOP-002-XS", Price = 3500, CompareAtPrice = 4500, PurchaseRate = 2200 },
                            new ProductVariant { Size = "S", StockQuantity = 12, IsActive = true, Sku = "WOM-TOP-002-S", Price = 3500, CompareAtPrice = 4500, PurchaseRate = 2200 },
                            new ProductVariant { Size = "M", StockQuantity = 14, IsActive = true, Sku = "WOM-TOP-002-M", Price = 3500, CompareAtPrice = 4500, PurchaseRate = 2200 },
                            new ProductVariant { Size = "L", StockQuantity = 8, IsActive = true, Sku = "WOM-TOP-002-L", Price = 3500, CompareAtPrice = 4500, PurchaseRate = 2200 }
                        }
                    },
                    new Product
                    {
                        Name = "Casual Cotton Top - White",
                        Slug = "casual-cotton-top-white",
                        Sku = "WOM-TOP-003",
                        ShortDescription = "Comfortable white cotton top for everyday wear",
                        Description = "Stay comfortable and stylish with this versatile white cotton top. A wardrobe essential that pairs well with anything.",

                        CategoryId = womenCat.Id, SubCategoryId = topsSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800",
                        StockQuantity = 70, IsActive = true, IsNew = false,
                        Tags = "Women, Tops, Cotton, Casual", Tier = "Premium",
                        FabricAndCare = "100% cotton. Machine wash warm.",
                        ShippingAndReturns = "Free shipping on orders over ৳2000. Returns within 14 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800", AltText = "Casual Cotton Top White Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800", AltText = "Casual Cotton Top White Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800", AltText = "Casual Cotton Top Black Variant", Label = "Black Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "XS", StockQuantity = 12, IsActive = true, Sku = "WOM-TOP-003-XS", Price = 1500, CompareAtPrice = 2000, PurchaseRate = 900 },
                            new ProductVariant { Size = "S", StockQuantity = 20, IsActive = true, Sku = "WOM-TOP-003-S", Price = 1500, CompareAtPrice = 2000, PurchaseRate = 900 },
                            new ProductVariant { Size = "M", StockQuantity = 22, IsActive = true, Sku = "WOM-TOP-003-M", Price = 1500, CompareAtPrice = 2000, PurchaseRate = 900 },
                            new ProductVariant { Size = "L", StockQuantity = 16, IsActive = true, Sku = "WOM-TOP-003-L", Price = 1500, CompareAtPrice = 2000, PurchaseRate = 900 }
                        }
                    }
                });
            }

            // Kids Products (3 products)
            var kidsCat = categories.FirstOrDefault(c => c.Slug == "kids");
            var girlsSub = FindSubCategory("kids", "girls");
            var boysSub = FindSubCategory("kids", "boys");

            if (kidsCat != null && girlsSub != null)
            {
                productsToAdd.Add(new Product
                {
                    Name = "Princess Party Dress - Pink",
                    Slug = "princess-party-dress-pink",
                    Sku = "KID-GRL-001",
                    ShortDescription = "Adorable pink party dress for little girls",
                    Description = "Let your little princess shine in this beautiful pink party dress with tulle layers and sparkly embellishments.",

                    CategoryId = kidsCat.Id,
                    SubCategoryId = girlsSub.Id,
                    ImageUrl = "https://images.unsplash.com/photo-1518837697477-94d4777248d6?w=800",
                    StockQuantity = 44,
                    IsActive = true,
                    IsNew = true,
                    Tags = "Kids, Girls, Dress, Party",
                    Tier = "Premium",
                    FabricAndCare = "Polyester tulle. Hand wash cold.",
                    ShippingAndReturns = "Free shipping. Returns within 14 days.",
                    Images = new List<ProductImage>
                    {
                        new ProductImage { Url = "https://images.unsplash.com/photo-1518837697477-94d4777248d6?w=800", AltText = "Princess Party Dress Pink Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                        new ProductImage { Url = "https://images.unsplash.com/photo-1514090458221-65bb69af63e6?w=800", AltText = "Princess Party Dress Pink Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                        new ProductImage { Url = "https://images.unsplash.com/photo-1503910392345-1593b4ff3af1?w=800", AltText = "Princess Party Dress Lavender Variant", Label = "Lavender Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                    },
                    Variants = new List<ProductVariant>
                    {
                        new ProductVariant { Size = "3-4Y", StockQuantity = 10, IsActive = true, Sku = "KID-GRL-001-3Y", Price = 4200, CompareAtPrice = 5500, PurchaseRate = 2800 },
                        new ProductVariant { Size = "5-6Y", StockQuantity = 14, IsActive = true, Sku = "KID-GRL-001-5Y", Price = 4200, CompareAtPrice = 5500, PurchaseRate = 2800 },
                        new ProductVariant { Size = "7-8Y", StockQuantity = 12, IsActive = true, Sku = "KID-GRL-001-7Y", Price = 4200, CompareAtPrice = 5500, PurchaseRate = 2800 },
                        new ProductVariant { Size = "9-10Y", StockQuantity = 8, IsActive = true, Sku = "KID-GRL-001-9Y", Price = 4200, CompareAtPrice = 5500, PurchaseRate = 2800 }
                    }
                });
            }

            if (kidsCat != null && boysSub != null)
            {
                productsToAdd.AddRange(new[]
                {
                    new Product
                    {
                        Name = "Boys Formal Shirt - Blue",
                        Slug = "boys-formal-shirt-blue",
                        Sku = "KID-BOY-001",
                        ShortDescription = "Smart blue formal shirt for boys",
                        Description = "Dress your little gentleman in this smart blue formal shirt. Perfect for school events, family gatherings, and special occasions.",

                        CategoryId = kidsCat.Id, SubCategoryId = boysSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1503910392345-1593b4ff3af1?w=800",
                        StockQuantity = 50, IsActive = true, IsNew = false,
                        Tags = "Kids, Boys, Formal, Shirt", Tier = "Premium",
                        FabricAndCare = "Cotton blend. Machine wash cold.",
                        ShippingAndReturns = "Free shipping. Returns within 14 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1503910392345-1593b4ff3af1?w=800", AltText = "Boys Formal Shirt Blue Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1514090458221-65bb69af63e6?w=800", AltText = "Boys Formal Shirt Blue Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1518837697477-94d4777248d6?w=800", AltText = "Boys Formal Shirt White Variant", Label = "White Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "3-4Y", StockQuantity = 10, IsActive = true, Sku = "KID-BOY-001-3Y", Price = 1800, CompareAtPrice = 2500, PurchaseRate = 1200 },
                            new ProductVariant { Size = "5-6Y", StockQuantity = 15, IsActive = true, Sku = "KID-BOY-001-5Y", Price = 1800, CompareAtPrice = 2500, PurchaseRate = 1200 },
                            new ProductVariant { Size = "7-8Y", StockQuantity = 15, IsActive = true, Sku = "KID-BOY-001-7Y", Price = 1800, CompareAtPrice = 2500, PurchaseRate = 1200 },
                            new ProductVariant { Size = "9-10Y", StockQuantity = 10, IsActive = true, Sku = "KID-BOY-001-9Y", Price = 1800, CompareAtPrice = 2500, PurchaseRate = 1200 }
                        }
                    },
                    new Product
                    {
                        Name = "Boys Casual T-Shirt Set",
                        Slug = "boys-casual-tshirt-set",
                        Sku = "KID-BOY-002",
                        ShortDescription = "Pack of 3 colorful t-shirts for boys",
                        Description = "Get great value with this pack of 3 comfortable cotton t-shirts in vibrant colors. Perfect for everyday wear and play.",

                        CategoryId = kidsCat.Id, SubCategoryId = boysSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1514090458221-65bb69af63e6?w=800",
                        StockQuantity = 64, IsActive = true, IsNew = true,
                        Tags = "Kids, Boys, Casual, T-shirt", Tier = "Premium",
                        FabricAndCare = "100% cotton. Machine wash warm.",
                        ShippingAndReturns = "Free shipping. Returns within 14 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1514090458221-65bb69af63e6?w=800", AltText = "Boys Casual T-Shirt Set Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1503910392345-1593b4ff3af1?w=800", AltText = "Boys Casual T-Shirt Set Colors", Label = "Color Options", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1518837697477-94d4777248d6?w=800", AltText = "Boys Casual T-Shirt Fabric Detail", Label = "Fabric Detail", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "3-4Y", StockQuantity = 14, IsActive = true, Sku = "KID-BOY-002-3Y", Price = 1200, CompareAtPrice = 1800, PurchaseRate = 800 },
                            new ProductVariant { Size = "5-6Y", StockQuantity = 18, IsActive = true, Sku = "KID-BOY-002-5Y", Price = 1200, CompareAtPrice = 1800, PurchaseRate = 800 },
                            new ProductVariant { Size = "7-8Y", StockQuantity = 18, IsActive = true, Sku = "KID-BOY-002-7Y", Price = 1200, CompareAtPrice = 1800, PurchaseRate = 800 },
                            new ProductVariant { Size = "9-10Y", StockQuantity = 14, IsActive = true, Sku = "KID-BOY-002-9Y", Price = 1200, CompareAtPrice = 1800, PurchaseRate = 800 }
                        }
                    }
                });
            }

            // Accessories
            var accessoriesCat = categories.FirstOrDefault(c => c.Slug == "accessories");
            var bagsSub = FindSubCategory("accessories", "bags");
            var watchesSub = FindSubCategory("accessories", "watches");

            if (accessoriesCat != null && bagsSub != null)
            {
                productsToAdd.Add(new Product
                {
                    Name = "Luxury Leather Handbag - Brown",
                    Slug = "luxury-leather-handbag-brown",
                    Sku = "ACC-BAG-001",
                    ShortDescription = "Premium brown leather handbag",
                    Description = "Carry your essentials in style with this premium brown leather handbag. Features multiple compartments and a detachable shoulder strap.",

                    CategoryId = accessoriesCat.Id,
                    SubCategoryId = bagsSub.Id,
                    ImageUrl = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800",
                    StockQuantity = 30,
                    IsActive = true,
                    IsNew = true,
                    Tags = "Accessories, Bags, Leather, Luxury",
                    Tier = "Luxury",
                    FabricAndCare = "Genuine leather. Wipe with damp cloth.",
                    ShippingAndReturns = "Free shipping. Returns within 7 days.",
                    Images = new List<ProductImage>
                    {
                        new ProductImage { Url = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800", AltText = "Luxury Leather Handbag Brown Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                        new ProductImage { Url = "https://images.unsplash.com/photo-1491336477066-31156b5e4f35?w=800", AltText = "Luxury Leather Handbag Brown Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                        new ProductImage { Url = "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800", AltText = "Luxury Leather Handbag Black Variant", Label = "Black Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                    },
                    Variants = new List<ProductVariant>
                    {
                        new ProductVariant { Size = "S", StockQuantity = 10, IsActive = true, Sku = "ACC-BAG-001-SM", Price = 8500, CompareAtPrice = 12000, PurchaseRate = 5500 },
                        new ProductVariant { Size = "M", StockQuantity = 12, IsActive = true, Sku = "ACC-BAG-001-MD", Price = 8500, CompareAtPrice = 12000, PurchaseRate = 5500 },
                        new ProductVariant { Size = "L", StockQuantity = 8, IsActive = true, Sku = "ACC-BAG-001-LG", Price = 8500, CompareAtPrice = 12000, PurchaseRate = 5500 }
                    }
                });
            }

            if (accessoriesCat != null && watchesSub != null)
            {
                productsToAdd.AddRange(new[]
                {
                    new Product
                    {
                        Name = "Men's Classic Wristwatch - Silver",
                        Slug = "mens-classic-wristwatch-silver",
                        Sku = "ACC-WAT-001",
                        ShortDescription = "Elegant silver wristwatch for men",
                        Description = "Timeless elegance meets modern functionality in this classic silver wristwatch. Water-resistant with a durable stainless steel band.",

                        CategoryId = accessoriesCat.Id, SubCategoryId = watchesSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800",
                        StockQuantity = 25, IsActive = true, IsNew = false,
                        Tags = "Accessories, Watches, Men, Classic", Tier = "Premium",
                        FabricAndCare = "Stainless steel. Water resistant up to 30m.",
                        ShippingAndReturns = "Free shipping. Returns within 7 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800", AltText = "Men's Classic Wristwatch Silver Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1491336477066-31156b5e4f35?w=800", AltText = "Men's Classic Wristwatch Silver Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800", AltText = "Men's Classic Wristwatch Gold Variant", Label = "Gold Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "Free Size", StockQuantity = 25, IsActive = true, Sku = "ACC-WAT-001-OS", Price = 4500, CompareAtPrice = 6000, PurchaseRate = 3000 }
                        }
                    },
                    new Product
                    {
                        Name = "Women's Rose Gold Watch",
                        Slug = "womens-rose-gold-watch",
                        Sku = "ACC-WAT-002",
                        ShortDescription = "Stylish rose gold watch for women",
                        Description = "Add a touch of sophistication to any outfit with this beautiful rose gold watch. Features a minimalist design with a comfortable mesh band.",

                        CategoryId = accessoriesCat.Id, SubCategoryId = watchesSub.Id,
                        ImageUrl = "https://images.unsplash.com/photo-1491336477066-31156b5e4f35?w=800",
                        StockQuantity = 18, IsActive = true, IsNew = true,
                        Tags = "Accessories, Watches, Women, Elegant", Tier = "Luxury",
                        FabricAndCare = "Rose gold plated steel. Water resistant up to 30m.",
                        ShippingAndReturns = "Free shipping. Returns within 7 days.",
                        Images = new List<ProductImage>
                        {
                            new ProductImage { Url = "https://images.unsplash.com/photo-1491336477066-31156b5e4f35?w=800", AltText = "Women's Rose Gold Watch Front", Label = "Front View", IsMain = true, DisplayOrder = 1, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800", AltText = "Women's Rose Gold Watch Side", Label = "Side View", IsMain = false, DisplayOrder = 2, MediaType = "image" },
                            new ProductImage { Url = "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800", AltText = "Women's Watch Silver Variant", Label = "Silver Variant", IsMain = false, DisplayOrder = 3, MediaType = "image" }
                        },
                        Variants = new List<ProductVariant>
                        {
                            new ProductVariant { Size = "Free Size", StockQuantity = 18, IsActive = true, Sku = "ACC-WAT-002-OS", Price = 5500, CompareAtPrice = 7500, PurchaseRate = 3800 }
                        }
                    }
                });
            }

            if (productsToAdd.Any())
            {
                await context.Products.AddRangeAsync(productsToAdd);
                await context.SaveChangesAsync();
            }
        }

        // Seed Reviews - Only if empty
        if (!await context.Reviews.AnyAsync())
        {

            // Proceed to seed
            var products = await context.Products.ToListAsync();
            var reviews = new List<Review>();
            var random = new Random();

            if (true /* Review seeding enabled */)
            {
                var customerNames = new[] { "Sarah M.", "John D.", "Emily R.", "Michael B.", "Jessica K.", "David L.", "Emma S.", "James P.", "Olivia H.", "Daniel W." };
                var positiveComments = new[]
                {
                "Absolutely love this product! The quality is outstanding.",
                "Exceeded my expectations. Will definitely buy again.",
                "Great value for money. Highly recommended.",
                "The material is so soft and comfortable.",
                "Perfect fit and looks amazing.",
                "Fast delivery and excellent packaging.",
                "Exactly what I was looking for. Five stars!",
                "Beautiful design and great craftsmanship."
            };
                var neutralComments = new[]
                {
                "Good product but sizing runs a bit small.",
                "Decent quality for the price.",
                "It's okay, nothing special.",
                "Took a while to arrive but the product is fine.",
                "Color is slightly different from the picture."
            };

                foreach (var product in products)
                {
                    var numberOfReviews = random.Next(2, 6); // 2 to 5 reviews per product

                    for (int i = 0; i < numberOfReviews; i++)
                    {
                        var isPositive = random.NextDouble() > 0.2; // 80% positive reviews
                        var rating = isPositive ? random.Next(4, 6) : random.Next(3, 5);
                        var comment = isPositive
                            ? positiveComments[random.Next(positiveComments.Length)]
                            : neutralComments[random.Next(neutralComments.Length)];

                        var daysAgo = random.Next(1, 365);

                        reviews.Add(new Review
                        {
                            ProductId = product.Id,
                            CustomerName = customerNames[random.Next(customerNames.Length)],
                            Rating = rating,
                            Comment = comment,
                            Date = DateTime.UtcNow.AddDays(-daysAgo),
                            IsVerifiedPurchase = random.NextDouble() > 0.1, // 90% verified
                            IsFeatured = isPositive && rating == 5 && random.NextDouble() > 0.7, // Some 5-star reviews are featured
                            IsApproved = true,
                            Likes = random.Next(0, 20)
                        });
                    }
                }

                await context.Reviews.AddRangeAsync(reviews);
                await context.SaveChangesAsync();
            }

            // Seed Hero Banners
            if (!await context.HeroBanners.AnyAsync())
            {
                var banners = new List<HeroBanner>
            {
                new HeroBanner
                {
                    Title = "Essential Refinement",
                    Subtitle = "Discover the art of minimalist sophistication. Designed for those who appreciate the subtle nuances of luxury.",
                    ImageUrl = "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1974&auto=format&fit=crop",
                    LinkUrl = "/shop",
                    ButtonText = "Shop Collection",
                    DisplayOrder = 1,
                    IsActive = true
                },
                new HeroBanner
                {
                    Title = "Editorial Grace",
                    Subtitle = "Capturing the essence of modern elegance through multi-layered refinements.",
                    ImageUrl = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
                    LinkUrl = "/shop",
                    ButtonText = "Explore Now",
                    DisplayOrder = 2,
                    IsActive = true
                },
                new HeroBanner
                {
                    Title = "Timeless Allure",
                    Subtitle = "A fusion of heritage craft and contemporary minimalist vision.",
                    ImageUrl = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop",
                    LinkUrl = "/shop",
                    ButtonText = "View Lookbook",
                    DisplayOrder = 3,
                    IsActive = true
                }
            };

                await context.HeroBanners.AddRangeAsync(banners);
                await context.SaveChangesAsync();
            }

            // Seed/Update Site Settings to Arza Mart
            var siteSettings = await context.SiteSettings.FirstOrDefaultAsync();
            if (siteSettings == null)
            {
                siteSettings = new SiteSetting
                {
                    WebsiteName = "Arza Mart",
                    ContactEmail = "support@arzamart.com",
                    ContactPhone = "+880 1234-567890",
                    Currency = "BDT",
                    FreeShippingThreshold = 5000,
                    ShippingCharge = 120
                };
                context.SiteSettings.Add(siteSettings);
                await context.SaveChangesAsync();
            }
            else if (siteSettings.WebsiteName != "Arza Mart")
            {
                siteSettings.WebsiteName = "Arza Mart";
                siteSettings.ContactEmail = "support@arzamart.com";
                await context.SaveChangesAsync();
            }

            // ── Seed Pages ──────────────────────────────────────────────────
            if (!await context.Pages.AnyAsync())
            {
                var pages = new List<Page>
                {
                    new Page { Title = "About Us", Slug = "about-us", Content = "<h1>About Arza Mart</h1><p>Arza Mart is your premier destination for high-quality fashion and lifestyle products in Bangladesh. We are committed to providing our customers with an exceptional shopping experience, offering a curated selection of traditional and contemporary apparel.</p>", MetaTitle = "About Us | Arza Mart", MetaDescription = "Learn more about Arza Mart and our mission to provide quality fashion." },
                    new Page { Title = "Privacy Policy", Slug = "privacy-policy", Content = "<h1>Privacy Policy</h1><p>At Arza Mart, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information.</p>", MetaTitle = "Privacy Policy | Arza Mart", MetaDescription = "Read our privacy policy to understand how we handle your data." },
                    new Page { Title = "Terms & Conditions", Slug = "terms-conditions", Content = "<h1>Terms & Conditions</h1><p>By using our website, you agree to comply with and be bound by the following terms and conditions of use.</p>", MetaTitle = "Terms & Conditions | Arza Mart", MetaDescription = "Review the terms and conditions for using Arza Mart's services." },
                    new Page { Title = "Return & Refund Policy", Slug = "return-policy", Content = "<h1>Return & Refund Policy</h1><p>We want you to be completely satisfied with your purchase. If you are not happy with an item, you can return it within 7 days of delivery.</p>", MetaTitle = "Return & Refund Policy | Arza Mart", MetaDescription = "Find out about our easy return and refund process." }
                };
                await context.Pages.AddRangeAsync(pages);
                await context.SaveChangesAsync();
            }

            // ── Seed Navigation Menus ───────────────────────────────────────
            if (!await context.NavigationMenus.AnyAsync())
            {
                var categories = await context.Categories.ToListAsync();
                var menus = new List<NavigationMenu>
                {
                    new NavigationMenu { Title = "Home", Url = "/", DisplayOrder = 1 },
                    new NavigationMenu { Title = "Shop", Url = "/shop", DisplayOrder = 2, IsMegaMenu = true },
                    new NavigationMenu { Title = "New Arrivals", Url = "/shop?isNew=true", DisplayOrder = 3 },
                    new NavigationMenu { Title = "Offers", Url = "/shop?isFeatured=true", DisplayOrder = 4 }
                };

                // Add Categories to Menu
                foreach (var category in categories)
                {
                    menus.Add(new NavigationMenu 
                    { 
                        Title = category.Name, 
                        Url = $"/category/{category.Slug}", 
                        CategoryId = category.Id, 
                        DisplayOrder = menus.Count + 1 
                    });
                }

                await context.NavigationMenus.AddRangeAsync(menus);
                await context.SaveChangesAsync();
            }

            // ── Seed Custom Landing Page Configs ────────────────────────────
            if (!await context.CustomLandingPageConfigs.AnyAsync())
            {
                var targetProducts = await context.Products
                    .Where(p => p.Slug == "royal-embroidered-sherwani-ivory" || p.Slug == "elegant-black-abaya-lace")
                    .ToListAsync();

                foreach (var product in targetProducts)
                {
                    var price = await context.ProductVariants
                        .Where(v => v.ProductId == product.Id)
                        .Select(v => (decimal?)v.Price)
                        .FirstOrDefaultAsync();

                    var originalPrice = await context.ProductVariants
                        .Where(v => v.ProductId == product.Id)
                        .Select(v => (decimal?)v.CompareAtPrice)
                        .FirstOrDefaultAsync();

                    var config = new CustomLandingPageConfig
                    {
                        ProductId = product.Id,
                        RelativeTimerTotalMinutes = 1440,
                        IsTimerVisible = true,
                        IsProductDetailsVisible = true,
                        IsFabricVisible = true,
                        IsDesignVisible = true,
                        IsTrustBannerVisible = true,
                        TrustBannerText = "দেখে চেক করে রিসিভ করতে পারবেন। পছন্দ না হলে ডেলিভারি চার্জ দিয়ে রিটার্ন করে দিতে পারবেন সহজেই",
                        FeaturedProductName = product.Name,
                        PromoPrice = price,
                        OriginalPrice = originalPrice
                    };

                    // Customize content based on product
                    if (product.Slug == "royal-embroidered-sherwani-ivory")
                    {
                        config.HeaderTitle = "রাজকীয় লুকে নিজেকে সাজাতে আজই অর্ডার করুন!";
                        config.ProductDetailsTitle = "✨ শেরওয়ানি ডিটেইলস";
                        config.TrustBannerText = "বিয়ে বা যেকোনো উৎসবে নিজেকে সেরা লুকে দেখতে এই শেরওয়ানিটি সেরা পছন্দ। কোয়ালিটি নিশ্চিত হয়েই পেমেন্ট করুন।";
                    }
                    else if (product.Slug == "elegant-black-abaya-lace")
                    {
                        config.HeaderTitle = "সবচেয়ে মার্জিত এবং স্টাইলিশ আবায়া এখন আপনার হাতের নাগালে!";
                        config.ProductDetailsTitle = "🌸 আবায়া ডিটেইলস";
                        config.TrustBannerText = "প্রিমিয়াম চেরি ফেব্রিক্স এবং নিখুঁত ডিজাইন। ভালো না লাগলে সাথে সাথেই রিটার্ন করতে পারবেন।";
                    }

                    context.CustomLandingPageConfigs.Add(config);
                }
                await context.SaveChangesAsync();
            }
        }
    }
}

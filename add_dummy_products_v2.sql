-- SQL Script to add 5 Dummy Products to arzamart database
-- Category IDs: 1: Men, 2: Women, 3: Kids, 4: Accessories
-- SubCategory IDs: 1: Sherwani, 4: Panjabi, 5: Abaya, 10: Boys, 13: Bags

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRANSACTION;

DECLARE @Now DATETIME = GETUTCDATE();

-- 1. Elite Cotton Panjabi (Men)
INSERT INTO Products (Name, Slug, Description, ShortDescription, Sku, ImageUrl, StockQuantity, IsActive, ProductType, IsNew, IsFeatured, CategoryId, SubCategoryId, CreatedAt, IsBundle, BundleQuantity, SortOrder)
VALUES ('Elite Cotton Panjabi - Charcoal', 'elite-cotton-panjabi-charcoal', 'Premium charcoal grey cotton panjabi with subtle self-design. Breathable fabric perfect for festive occasions.', 'Premium charcoal grey cotton panjabi', 'DUM-PAN-001', 'https://images.unsplash.com/photo-1621510456681-233013d82a13?w=800', 50, 1, 0, 1, 1, 1, 4, @Now, 0, 1, 0);
DECLARE @P1 INT = SCOPE_IDENTITY();

INSERT INTO ProductImages (Url, AltText, Label, MediaType, IsMain, DisplayOrder, ProductId, CreatedAt)
VALUES ('https://images.unsplash.com/photo-1621510456681-233013d82a13?w=800', 'Elite Cotton Panjabi Charcoal', 'Main Image', 'image', 1, 1, @P1, @Now);

INSERT INTO ProductVariants (Sku, Size, Price, CompareAtPrice, PurchaseRate, StockQuantity, IsActive, ProductId, CreatedAt)
VALUES ('DUM-PAN-001-S', 'S', 2500, 2200, 1500, 10, 1, @P1, @Now),
       ('DUM-PAN-001-M', 'M', 2500, 2200, 1500, 20, 1, @P1, @Now),
       ('DUM-PAN-001-L', 'L', 2500, 2200, 1500, 20, 1, @P1, @Now);

-- 2. Midnight Velvet Abaya (Women)
INSERT INTO Products (Name, Slug, Description, ShortDescription, Sku, ImageUrl, StockQuantity, IsActive, ProductType, IsNew, IsFeatured, CategoryId, SubCategoryId, CreatedAt, IsBundle, BundleQuantity, SortOrder)
VALUES ('Midnight Velvet Abaya', 'midnight-velvet-abaya', 'Luxurious midnight black velvet abaya with exquisite silver embroidery on sleeves and hem.', 'Luxurious black velvet abaya', 'DUM-ABA-001', 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800', 40, 1, 0, 1, 1, 2, 5, @Now, 0, 1, 0);
DECLARE @P2 INT = SCOPE_IDENTITY();

INSERT INTO ProductImages (Url, AltText, Label, MediaType, IsMain, DisplayOrder, ProductId, CreatedAt)
VALUES ('https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800', 'Midnight Velvet Abaya', 'Main Image', 'image', 1, 1, @P2, @Now);

INSERT INTO ProductVariants (Sku, Size, Price, CompareAtPrice, PurchaseRate, StockQuantity, IsActive, ProductId, CreatedAt)
VALUES ('DUM-ABA-001-S', 'S', 4500, 4000, 3000, 10, 1, @P2, @Now),
       ('DUM-ABA-001-M', 'M', 4500, 4000, 3000, 15, 1, @P2, @Now),
       ('DUM-ABA-001-L', 'L', 4500, 4000, 3000, 15, 1, @P2, @Now);

-- 3. Junior Gent Blue Shirt (Kids)
INSERT INTO Products (Name, Slug, Description, ShortDescription, Sku, ImageUrl, StockQuantity, IsActive, ProductType, IsNew, IsFeatured, CategoryId, SubCategoryId, CreatedAt, IsBundle, BundleQuantity, SortOrder)
VALUES ('Junior Gent Blue Shirt', 'junior-gent-blue-shirt', 'Smart sky blue formal shirt for boys. Made from soft, non-irritant cotton fabric.', 'Smart sky blue boys shirt', 'DUM-KID-001', 'https://images.unsplash.com/photo-1503910392345-1593b4ff3af1?w=800', 60, 1, 0, 1, 0, 3, 10, @Now, 0, 1, 0);
DECLARE @P3 INT = SCOPE_IDENTITY();

INSERT INTO ProductImages (Url, AltText, Label, MediaType, IsMain, DisplayOrder, ProductId, CreatedAt)
VALUES ('https://images.unsplash.com/photo-1503910392345-1593b4ff3af1?w=800', 'Junior Gent Blue Shirt', 'Main Image', 'image', 1, 1, @P3, @Now);

INSERT INTO ProductVariants (Sku, Size, Price, CompareAtPrice, PurchaseRate, StockQuantity, IsActive, ProductId, CreatedAt)
VALUES ('DUM-KID-001-3Y', '3-4Y', 1500, 1200, 800, 20, 1, @P3, @Now),
       ('DUM-KID-001-5Y', '5-6Y', 1500, 1200, 800, 20, 1, @P3, @Now),
       ('DUM-KID-001-7Y', '7-8Y', 1500, 1200, 800, 20, 1, @P3, @Now);

-- 4. Urban Explorer Backpack (Accessories)
INSERT INTO Products (Name, Slug, Description, ShortDescription, Sku, ImageUrl, StockQuantity, IsActive, ProductType, IsNew, IsFeatured, CategoryId, SubCategoryId, CreatedAt, IsBundle, BundleQuantity, SortOrder)
VALUES ('Urban Explorer Backpack', 'urban-explorer-backpack', 'Durable water-resistant backpack with padded laptop compartment and multiple utility pockets.', 'Durable water-resistant backpack', 'DUM-BAG-001', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800', 25, 1, 0, 1, 0, 4, 13, @Now, 0, 1, 0);
DECLARE @P4 INT = SCOPE_IDENTITY();

INSERT INTO ProductImages (Url, AltText, Label, MediaType, IsMain, DisplayOrder, ProductId, CreatedAt)
VALUES ('https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800', 'Urban Explorer Backpack', 'Main Image', 'image', 1, 1, @P4, @Now);

INSERT INTO ProductVariants (Sku, Size, Price, CompareAtPrice, PurchaseRate, StockQuantity, IsActive, ProductId, CreatedAt)
VALUES ('DUM-BAG-001-FS', 'Free Size', 3200, 2800, 2000, 25, 1, @P4, @Now);

-- 5. Royal Brocade Sherwani (Men)
INSERT INTO Products (Name, Slug, Description, ShortDescription, Sku, ImageUrl, StockQuantity, IsActive, ProductType, IsNew, IsFeatured, CategoryId, SubCategoryId, CreatedAt, IsBundle, BundleQuantity, SortOrder)
VALUES ('Royal Brocade Sherwani - Maroon', 'royal-brocade-sherwani-maroon', 'Exquisite maroon brocade sherwani with antique gold buttons and traditional embroidery.', 'Exquisite maroon brocade sherwani', 'DUM-SHR-001', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800', 15, 1, 0, 1, 1, 1, 1, @Now, 0, 1, 0);
DECLARE @P5 INT = SCOPE_IDENTITY();

INSERT INTO ProductImages (Url, AltText, Label, MediaType, IsMain, DisplayOrder, ProductId, CreatedAt)
VALUES ('https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800', 'Royal Brocade Sherwani Maroon', 'Main Image', 'image', 1, 1, @P5, @Now);

INSERT INTO ProductVariants (Sku, Size, Price, CompareAtPrice, PurchaseRate, StockQuantity, IsActive, ProductId, CreatedAt)
VALUES ('DUM-SHR-001-M', 'M', 12000, 10500, 8000, 5, 1, @P5, @Now),
       ('DUM-SHR-001-L', 'L', 12000, 10500, 8000, 5, 1, @P5, @Now),
       ('DUM-SHR-001-XL', 'XL', 12000, 10500, 8000, 5, 1, @P5, @Now);

COMMIT;
SELECT 'Successfully added 5 dummy products.' AS Result;

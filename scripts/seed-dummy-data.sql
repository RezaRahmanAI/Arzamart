/*
 * ArzaMart Dummy Data Seed Script
 * Server: REZA | Database: arzamartcom
 * Run: sqlcmd -S REZA -d arzamartcom -i scripts\seed-dummy-data.sql
 */

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @AdminId NVARCHAR(450) = 'ec790890-05b1-4993-81e9-b8559660ebdc';
DECLARE @UtcNow DATETIME2 = GETUTCDATE();

-- ============================================================
-- STEP 1: Independent tables
-- ============================================================

SET IDENTITY_INSERT [dbo].[ProductGroups] ON;
INSERT INTO [dbo].[ProductGroups] ([Id],[Name],[Description],[CreatedAt],[UpdatedAt]) VALUES
(1, N'T-Shirt Bundle', N'Mix and match t-shirt packs', @UtcNow, NULL),
(2, N'Ethnic Wear Set', N'Panjabi and salwar kameez combos', @UtcNow, NULL),
(3, N'Winter Essentials', N'Jacket, sweater, and scarf bundles', @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[ProductGroups] OFF;

SET IDENTITY_INSERT [dbo].[DeliveryMethods] ON;
INSERT INTO [dbo].[DeliveryMethods] ([Id],[Name],[Cost],[EstimatedDays],[IsActive],[CreatedAt],[UpdatedAt]) VALUES
(1, N'Standard Delivery', 60.00, N'3-5 days', 1, @UtcNow, NULL),
(2, N'Express Delivery', 120.00, N'1-2 days', 1, @UtcNow, NULL),
(3, N'Same Day Delivery (Dhaka)', 200.00, N'Same day', 1, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[DeliveryMethods] OFF;

SET IDENTITY_INSERT [dbo].[SourcePages] ON;
INSERT INTO [dbo].[SourcePages] ([Id],[Name],[IsActive],[CreatedAt],[UpdatedAt]) VALUES
(1, N'Home Page', 1, @UtcNow, NULL),
(2, N'Product Page', 1, @UtcNow, NULL),
(3, N'Category Page', 1, @UtcNow, NULL),
(4, N'Landing Page', 1, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[SourcePages] OFF;

SET IDENTITY_INSERT [dbo].[SocialMediaSources] ON;
INSERT INTO [dbo].[SocialMediaSources] ([Id],[Name],[IsActive],[CreatedAt],[UpdatedAt]) VALUES
(1, N'Facebook', 1, @UtcNow, NULL),
(2, N'Instagram', 1, @UtcNow, NULL),
(3, N'Google Ads', 1, @UtcNow, NULL),
(4, N'TikTok', 1, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[SocialMediaSources] OFF;

-- ============================================================
-- STEP 2: SubCategories (FK -> Categories 1-4)
-- ============================================================

SET IDENTITY_INSERT [dbo].[SubCategories] ON;
INSERT INTO [dbo].[SubCategories] ([Id],[Name],[Slug],[DisplayOrder],[IsActive],[CategoryId],[CreatedAt],[UpdatedAt]) VALUES
(1,  N'T-Shirts',       N'men-tshirts',       1, 1, 1, @UtcNow, NULL),
(2,  N'Pants',          N'men-pants',         2, 1, 1, @UtcNow, NULL),
(3,  N'Kurtis',         N'women-kurtis',      1, 1, 2, @UtcNow, NULL),
(4,  N'Sarees',         N'women-sarees',      2, 1, 2, @UtcNow, NULL),
(5,  N'Boys Clothing',  N'children-boys',     1, 1, 3, @UtcNow, NULL),
(6,  N'Girls Clothing', N'children-girls',    2, 1, 3, @UtcNow, NULL),
(7,  N'Bags',           N'acc-bags',          1, 1, 4, @UtcNow, NULL),
(8,  N'Watches',        N'acc-watches',       2, 1, 4, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[SubCategories] OFF;

-- ============================================================
-- STEP 3: Collections (FK -> SubCategories)
-- ============================================================

SET IDENTITY_INSERT [dbo].[Collections] ON;
INSERT INTO [dbo].[Collections] ([Id],[Name],[Slug],[Description],[DisplayOrder],[IsActive],[SubCategoryId],[CreatedAt],[UpdatedAt]) VALUES
(1, N'Summer Collection 2026',   N'summer-2026',   N'Light and breathable summer wear',        1, 1, 1, @UtcNow, NULL),
(2, N'Winter Essentials 2026',   N'winter-2026',   N'Warm and cozy winter clothing',           1, 1, 2, @UtcNow, NULL),
(3, N'Festive Saree Edit',       N'festive-saree',  N'Handpicked sarees for special occasions', 1, 1, 4, @UtcNow, NULL),
(4, N'Daily Wear Kurtis',        N'daily-kurtis',   N'Comfortable everyday kurtis',             1, 1, 3, @UtcNow, NULL),
(5, N'Kids Party Wear',          N'kids-party',     N'Colorful outfits for kids parties',        1, 1, 5, @UtcNow, NULL),
(6, N'Premium Watches',          N'premium-watches',N'Luxury watches for every occasion',        1, 1, 8, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[Collections] OFF;

-- ============================================================
-- STEP 4: Products
-- ============================================================

SET IDENTITY_INSERT [dbo].[Products] ON;
INSERT INTO [dbo].[Products] ([Id],[Name],[Slug],[Description],[ShortDescription],[Sku],[StockQuantity],[IsActive],[ProductType],[IsNew],[IsFeatured],[SortOrder],[CategoryId],[SubCategoryId],[CollectionId],[IsBundle],[BundleQuantity],[CreatedAt],[UpdatedAt]) VALUES
(1,  N'Classic Cotton T-Shirt',      N'classic-cotton-tshirt',      N'Soft premium cotton t-shirt for everyday wear.',         N'100% cotton crew neck',           N'MEN-TS-001', 50, 1, 0, 0, 1, 1,  1, 1, 1,  0, 0, @UtcNow, NULL),
(2,  N'Graphic Print Tee',           N'graphic-print-tee',          N'Bold graphic print on comfortable fabric.',             N'Urban graphic design',            N'MEN-TS-002', 35, 1, 0, 1, 0, 2,  1, 1, 1,  0, 0, @UtcNow, NULL),
(3,  N'Polo Neck T-Shirt',           N'polo-neck-tshirt',           N'Classic polo neck for a smart casual look.',            N'Polo collar cotton',              N'MEN-TS-003', 40, 1, 0, 0, 0, 3,  1, 1, NULL, 0, 0, @UtcNow, NULL),
(4,  N'Slim Fit Denim Jeans',        N'slim-fit-denim-jeans',       N'Stretchy slim fit jeans with modern cut.',              N'Slim fit blue denim',             N'MEN-PN-001', 30, 1, 0, 0, 1, 4,  1, 2, 2,  0, 0, @UtcNow, NULL),
(5,  N'Chino Pants',                 N'chino-pants',                N'Versatile chinos for office or casual wear.',           N'Cotton chino flat front',         N'MEN-PN-002', 25, 1, 0, 0, 0, 5,  1, 2, NULL, 0, 0, @UtcNow, NULL),
(6,  N'Embroidered Cotton Kurti',    N'embroidered-cotton-kurti',   N'Beautiful hand-embroidered cotton kurti.',              N'Floral embroidery kurti',         N'WOM-KT-001', 45, 1, 0, 1, 1, 6,  2, 3, 4,  0, 0, @UtcNow, NULL),
(7,  N'A-Line Rayon Kurti',          N'arline-rayon-kurti',         N'Flowy A-line kurti in premium rayon.',                 N'A-line silhouette rayon',         N'WOM-KT-002', 38, 1, 0, 0, 0, 7,  2, 3, 4,  0, 0, @UtcNow, NULL),
(8,  N'Banarasi Silk Saree',         N'banarasi-silk-saree',        N'Elegant Banarasi silk with intricate zari work.',       N'Pure silk Banarasi weave',        N'WOM-SR-001', 15, 1, 0, 1, 1, 8,  2, 4, 3,  0, 0, @UtcNow, NULL),
(9,  N'Cotton Handloom Saree',       N'cotton-handloom-saree',      N'Lightweight handloom cotton saree.',                    N'Handloom cotton casual',          N'WOM-SR-002', 20, 1, 0, 0, 0, 9,  2, 4, NULL, 0, 0, @UtcNow, NULL),
(10, N'Boys Graphic T-Shirt',        N'boys-graphic-tshirt',        N'Fun graphic tee for boys.',                             N'Cotton graphic tee kids',         N'KID-BT-001', 60, 1, 0, 0, 0, 10, 3, 5, 5,  0, 0, @UtcNow, NULL),
(11, N'Girls Frock Dress',           N'girls-frock-dress',          N'Adorable frock dress for girls.',                       N'Tulle frock with bow',            N'KID-GF-001', 40, 1, 0, 1, 0, 11, 3, 6, NULL, 0, 0, @UtcNow, NULL),
(12, N'Leather Crossbody Bag',       N'leather-crossbody-bag',      N'Stylish genuine leather crossbody.',                    N'Genuine leather compact bag',     N'ACC-BG-001', 20, 1, 0, 0, 1, 12, 4, 7, NULL, 0, 0, @UtcNow, NULL),
(13, N'Minimalist Analog Watch',     N'minimalist-analog-watch',    N'Sleek minimal analog watch with leather strap.',        N'Japanese quartz movement',        N'ACC-WT-001', 25, 1, 0, 1, 1, 13, 4, 8, 6,  0, 0, @UtcNow, NULL),
(14, N'Upcoming Winter Jacket',      N'upcoming-winter-jacket',     N'Premium winter jacket launching soon.',                 N'Water-resistant puffer jacket',   N'MEN-WJ-001', 0,  0, 0, 1, 0, 14, 1, 2, NULL, 0, 0, @UtcNow, NULL),
(15, N'Men Casual Combo Set',        N'men-casual-combo-set',       N'T-shirt + Pants combo at a special price.',             N'1 T-shirt + 1 Pants bundle',      N'MEN-CB-001', 10, 1, 1, 0, 1, 15, 1, 1, NULL, 1, 3, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[Products] OFF;

-- ============================================================
-- STEP 5: ProductVariants
-- ============================================================

SET IDENTITY_INSERT [dbo].[ProductVariants] ON;
INSERT INTO [dbo].[ProductVariants] ([Id],[Sku],[Size],[Price],[CompareAtPrice],[PurchaseRate],[StockQuantity],[IsActive],[ProductId],[CreatedAt],[UpdatedAt]) VALUES
(1,  N'MEN-TS-001-S',   N'S',    499.00,  699.00,  180.00, 25, 1, 1,  @UtcNow, NULL),
(2,  N'MEN-TS-001-M',   N'M',    499.00,  699.00,  180.00, 25, 1, 1,  @UtcNow, NULL),
(3,  N'MEN-TS-002-S',   N'S',    599.00,  799.00,  220.00, 18, 1, 2,  @UtcNow, NULL),
(4,  N'MEN-TS-002-M',   N'M',    599.00,  799.00,  220.00, 17, 1, 2,  @UtcNow, NULL),
(5,  N'MEN-TS-003-M',   N'M',    649.00,  849.00,  240.00, 20, 1, 3,  @UtcNow, NULL),
(6,  N'MEN-TS-003-L',   N'L',    649.00,  849.00,  240.00, 20, 1, 3,  @UtcNow, NULL),
(7,  N'MEN-PN-001-30',  N'30',  1299.00, 1599.00,  450.00, 15, 1, 4,  @UtcNow, NULL),
(8,  N'MEN-PN-001-32',  N'32',  1299.00, 1599.00,  450.00, 15, 1, 4,  @UtcNow, NULL),
(9,  N'MEN-PN-002-30',  N'30',   999.00, 1199.00,  350.00, 12, 1, 5,  @UtcNow, NULL),
(10, N'MEN-PN-002-32',  N'32',   999.00, 1199.00,  350.00, 13, 1, 5,  @UtcNow, NULL),
(11, N'WOM-KT-001-S',   N'S',   1199.00, 1499.00,  400.00, 22, 1, 6,  @UtcNow, NULL),
(12, N'WOM-KT-001-M',   N'M',   1199.00, 1499.00,  400.00, 23, 1, 6,  @UtcNow, NULL),
(13, N'WOM-KT-002-M',   N'M',    899.00, 1099.00,  300.00, 20, 1, 7,  @UtcNow, NULL),
(14, N'WOM-KT-002-L',   N'L',    899.00, 1099.00,  300.00, 18, 1, 7,  @UtcNow, NULL),
(15, N'WOM-SR-001-UNI', N'Free', 3499.00, 4499.00, 1200.00, 10, 1, 8,  @UtcNow, NULL),
(16, N'WOM-SR-001-UN2', N'Free', 3499.00, 4499.00, 1200.00,  5, 1, 8,  @UtcNow, NULL),
(17, N'WOM-SR-002-UNI', N'Free', 1799.00, 2299.00,  600.00, 12, 1, 9,  @UtcNow, NULL),
(18, N'WOM-SR-002-UN2', N'Free', 1799.00, 2299.00,  600.00,  8, 1, 9,  @UtcNow, NULL),
(19, N'KID-BT-001-6Y',  N'6Y',    399.00,  499.00,  120.00, 30, 1, 10, @UtcNow, NULL),
(20, N'KID-BT-001-8Y',  N'8Y',    399.00,  499.00,  120.00, 30, 1, 10, @UtcNow, NULL),
(21, N'KID-GF-001-4Y',  N'4Y',    699.00,  899.00,  250.00, 20, 1, 11, @UtcNow, NULL),
(22, N'KID-GF-001-6Y',  N'6Y',    699.00,  899.00,  250.00, 20, 1, 11, @UtcNow, NULL),
(23, N'ACC-BG-001-UNI', N'Free', 2499.00, 2999.00,  800.00, 10, 1, 12, @UtcNow, NULL),
(24, N'ACC-BG-001-UN2', N'Free', 2499.00, 2999.00,  800.00, 10, 1, 12, @UtcNow, NULL),
(25, N'ACC-WT-001-UNI', N'Free', 1999.00, 2499.00,  700.00, 12, 1, 13, @UtcNow, NULL),
(26, N'ACC-WT-001-UN2', N'Free', 1999.00, 2499.00,  700.00, 13, 1, 13, @UtcNow, NULL),
(27, N'MEN-CB-001-M',   N'M',   1499.00, 1998.00,  530.00, 10, 1, 15, @UtcNow, NULL),
(28, N'MEN-CB-001-L',   N'L',   1499.00, 1998.00,  530.00,  0, 1, 15, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[ProductVariants] OFF;

-- ============================================================
-- STEP 5b: ProductImages
-- ============================================================

SET IDENTITY_INSERT [dbo].[ProductImages] ON;
INSERT INTO [dbo].[ProductImages] ([Id],[Url],[AltText],[Label],[MediaType],[IsMain],[DisplayOrder],[ProductId],[CreatedAt],[UpdatedAt]) VALUES
(1,  N'/uploads/products/classic-cotton-tshirt-main.jpg',  N'Classic Cotton T-Shirt',   N'Main',    N'image', 1, 0, 1,  @UtcNow, NULL),
(2,  N'/uploads/products/classic-cotton-tshirt-alt.jpg',    N'Classic Cotton T-Shirt',   N'Alt',     N'image', 0, 1, 1,  @UtcNow, NULL),
(3,  N'/uploads/products/graphic-print-tee-main.jpg',       N'Graphic Print Tee',        N'Main',    N'image', 1, 0, 2,  @UtcNow, NULL),
(4,  N'/uploads/products/polo-neck-tshirt-main.jpg',        N'Polo Neck T-Shirt',        N'Main',    N'image', 1, 0, 3,  @UtcNow, NULL),
(5,  N'/uploads/products/slim-fit-denim-main.jpg',          N'Slim Fit Denim Jeans',     N'Main',    N'image', 1, 0, 4,  @UtcNow, NULL),
(6,  N'/uploads/products/chino-pants-main.jpg',             N'Chino Pants',              N'Main',    N'image', 1, 0, 5,  @UtcNow, NULL),
(7,  N'/uploads/products/embroidered-kurti-main.jpg',       N'Embroidered Cotton Kurti', N'Main',    N'image', 1, 0, 6,  @UtcNow, NULL),
(8,  N'/uploads/products/embroidered-kurti-alt.jpg',        N'Embroidered Cotton Kurti', N'Alt',     N'image', 0, 1, 6,  @UtcNow, NULL),
(9,  N'/uploads/products/arline-kurti-main.jpg',            N'A-Line Rayon Kurti',       N'Main',    N'image', 1, 0, 7,  @UtcNow, NULL),
(10, N'/uploads/products/banarasi-saree-main.jpg',          N'Banarasi Silk Saree',      N'Main',    N'image', 1, 0, 8,  @UtcNow, NULL),
(11, N'/uploads/products/banarasi-saree-alt.jpg',           N'Banarasi Silk Saree',      N'Detail',  N'image', 0, 1, 8,  @UtcNow, NULL),
(12, N'/uploads/products/cotton-handloom-main.jpg',         N'Cotton Handloom Saree',    N'Main',    N'image', 1, 0, 9,  @UtcNow, NULL),
(13, N'/uploads/products/boys-graphic-main.jpg',            N'Boys Graphic T-Shirt',     N'Main',    N'image', 1, 0, 10, @UtcNow, NULL),
(14, N'/uploads/products/girls-frock-main.jpg',             N'Girls Frock Dress',        N'Main',    N'image', 1, 0, 11, @UtcNow, NULL),
(15, N'/uploads/products/leather-bag-main.jpg',             N'Leather Crossbody Bag',    N'Main',    N'image', 1, 0, 12, @UtcNow, NULL),
(16, N'/uploads/products/leather-bag-alt.jpg',              N'Leather Crossbody Bag',    N'Detail',  N'image', 0, 1, 12, @UtcNow, NULL),
(17, N'/uploads/products/minimalist-watch-main.jpg',        N'Minimalist Analog Watch',  N'Main',    N'image', 1, 0, 13, @UtcNow, NULL),
(18, N'/uploads/products/winter-jacket-main.jpg',           N'Upcoming Winter Jacket',   N'Main',    N'image', 1, 0, 14, @UtcNow, NULL),
(19, N'/uploads/products/combo-set-main.jpg',               N'Men Casual Combo Set',     N'Main',    N'image', 1, 0, 15, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[ProductImages] OFF;

-- ============================================================
-- STEP 5c: Reviews
-- ============================================================

SET IDENTITY_INSERT [dbo].[Reviews] ON;
INSERT INTO [dbo].[Reviews] ([Id],[ProductId],[CustomerName],[Rating],[Comment],[Date],[IsVerifiedPurchase],[IsFeatured],[IsApproved],[Likes],[CreatedAt],[UpdatedAt]) VALUES
(1,  1,  N'Rahim Uddin',     5, N'Excellent quality cotton! Fits perfectly.',                    DATEADD(DAY, -10, @UtcNow), 1, 1, 1, 12, @UtcNow, NULL),
(2,  1,  N'Fatema Begum',    4, N'Good t-shirt but runs slightly small.',                        DATEADD(DAY, -8, @UtcNow),  1, 0, 1, 5,  @UtcNow, NULL),
(3,  2,  N'Karim Ahmed',     5, N'Love the graphic design! Very eye-catching.',                   DATEADD(DAY, -7, @UtcNow),  1, 1, 1, 8,  @UtcNow, NULL),
(4,  4,  N'Tanvir Hassan',   5, N'Best jeans I have bought in this price range.',                 DATEADD(DAY, -6, @UtcNow),  1, 0, 1, 15, @UtcNow, NULL),
(5,  6,  N'Nusrat Jahan',    5, N'Beautiful embroidery work. Highly recommended!',                DATEADD(DAY, -5, @UtcNow),  1, 1, 1, 20, @UtcNow, NULL),
(6,  6,  N'Sabrina Akter',   4, N'Nice kurti. Fabric is soft and comfortable.',                   DATEADD(DAY, -4, @UtcNow),  1, 0, 1, 7,  @UtcNow, NULL),
(7,  8,  N'Tasnim Rahman',   5, N'Stunning saree! The zari work is exquisite.',                   DATEADD(DAY, -3, @UtcNow),  1, 1, 1, 25, @UtcNow, NULL),
(8,  10, N'Rafiqul Islam',   4, N'Good shirt for the price. My son loves it.',                    DATEADD(DAY, -2, @UtcNow),  1, 0, 1, 3,  @UtcNow, NULL),
(9,  12, N'Mahmudul Hasan',  5, N'Premium quality leather. Looks very elegant.',                   DATEADD(DAY, -1, @UtcNow),  1, 1, 1, 18, @UtcNow, NULL),
(10, 13, N'Arifur Rahman',   5, N'Minimal and classy watch. Goes with everything.',               @UtcNow,                     1, 0, 1, 10, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[Reviews] OFF;

-- ============================================================
-- STEP 5d: ComboItems
-- ============================================================

SET IDENTITY_INSERT [dbo].[ComboItems] ON;
INSERT INTO [dbo].[ComboItems] ([Id],[ComboProductId],[ProductId],[ProductVariantId],[Quantity],[CreatedAt],[UpdatedAt]) VALUES
(1, 15, 1,  2,  1, @UtcNow, NULL),
(2, 15, 4,  8,  1, @UtcNow, NULL),
(3, 15, 3,  6,  1, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[ComboItems] OFF;

-- ============================================================
-- STEP 5e: CustomLandingPageConfigs
-- ============================================================

SET IDENTITY_INSERT [dbo].[CustomLandingPageConfigs] ON;
INSERT INTO [dbo].[CustomLandingPageConfigs] ([Id],[ProductId],[RelativeTimerTotalMinutes],[IsTimerVisible],[HeaderTitle],[IsProductDetailsVisible],[ProductDetailsTitle],[IsFabricVisible],[IsDesignVisible],[IsTrustBannerVisible],[TrustBannerText],[TrustBannerDescription],[IsFeaturedOrderVisible],[FeaturedProductName],[PromoPrice],[OriginalPrice],[PromoText],[FreeShippingThresholdQuantity],[IsMarqueeVisible],[MarqueeText],[CreatedAt],[UpdatedAt]) VALUES
(1, 8,  1440, 1, N'Banarasi Silk — Limited Stock!',  1, N'Product Details',   1, 1, 1, N'Authentic Banarasi',   N'100% genuine Banarasi silk from Varanasi.', 1, N'Banarasi Silk Saree', 3499.00, 4499.00, N'Special Launch Price!', 2, 1, N'Free shipping on 2+ sarees!', @UtcNow, NULL),
(2, 13, 2880, 1, N'Minimalist Watch — Pre-order Now', 1, N'Product Details', 1, 1, 1, N'Japanese Quartz',      N'Premium movement with 2 year warranty.',     1, N'Minimalist Analog Watch', 1999.00, 2499.00, N'Early bird offer!', NULL, 0, NULL, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[CustomLandingPageConfigs] OFF;

-- ============================================================
-- STEP 6: Customers, SiteSettings, Pages, HeroBanners, NavMenus, etc.
-- ============================================================

SET IDENTITY_INSERT [dbo].[Customers] ON;
INSERT INTO [dbo].[Customers] ([Id],[Phone],[Name],[Address],[City],[Area],[IsSuspicious],[CreatedAt],[UpdatedAt]) VALUES
(1, N'01712345678', N'Rahim Uddin',    N'House 12, Road 5',  N'Dhaka',      N'Gulshan',    0, @UtcNow, NULL),
(2, N'01812345678', N'Fatema Begum',   N'House 8, Road 10',  N'Dhaka',      N'Banani',     0, @UtcNow, NULL),
(3, N'01912345678', N'Karim Ahmed',    N'Flat 3B, Tower 2',  N'Dhaka',      N'Uttara',     0, @UtcNow, NULL),
(4, N'01612345678', N'Tanvir Hassan',  N'House 45, Lane 3',  N'Chittagong', N'Agrabad',    0, @UtcNow, NULL),
(5, N'01512345678', N'Nusrat Jahan',   N'House 7, Road 8',   N'Dhaka',      N'Dhanmondi',  0, @UtcNow, NULL),
(6, N'01312345678', N'Sabrina Akter',  N'Flat 5A, Block C',  N'Dhaka',      N'Mirpur',     0, @UtcNow, NULL),
(7, N'01412345678', N'Mahmudul Hasan', N'House 22, Road 2',  N'Rajshahi',   N'Boalia',     0, @UtcNow, NULL),
(8, N'01112345678', N'Arifur Rahman',  N'House 9, Road 15',  N'Dhaka',      N'Mohammadpur',0, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[Customers] OFF;

SET IDENTITY_INSERT [dbo].[SiteSettings] ON;
INSERT INTO [dbo].[SiteSettings] ([Id],[WebsiteName],[LogoUrl],[ContactEmail],[ContactPhone],[Address],[FacebookUrl],[InstagramUrl],[Currency],[FreeShippingThreshold],[ShippingCharge],[CreatedAt],[UpdatedAt]) VALUES
(1, N'Arza Mart', N'/uploads/logo.png', N'info@arzamart.com', N'+880 1712-345678', N'Road 12, Banani, Dhaka 1213, Bangladesh', N'https://facebook.com/arzamart', N'https://instagram.com/arzamart', N'BDT', 3000.00, 60.00, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[SiteSettings] OFF;

SET IDENTITY_INSERT [dbo].[Pages] ON;
INSERT INTO [dbo].[Pages] ([Id],[Title],[Slug],[Content],[MetaTitle],[MetaDescription],[IsActive],[CreatedAt],[UpdatedAt]) VALUES
(1, N'About Us',          N'about-us',       N'<h1>About Arza Mart</h1><p>We are a leading fashion brand in Bangladesh...</p>',        N'About Us - Arza Mart',          N'Learn about Arza Mart and our mission.',           1, @UtcNow, NULL),
(2, N'Privacy Policy',    N'privacy-policy',  N'<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>',                      N'Privacy Policy - Arza Mart',    N'Arza Mart privacy policy.',                       1, @UtcNow, NULL),
(3, N'Terms & Conditions',N'terms-conditions',N'<h1>Terms and Conditions</h1><p>By using our website you agree to these terms...</p>', N'Terms - Arza Mart',            N'Arza Mart terms and conditions.',                 1, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[Pages] OFF;

SET IDENTITY_INSERT [dbo].[HeroBanners] ON;
INSERT INTO [dbo].[HeroBanners] ([Id],[Title],[Subtitle],[ImageUrl],[MobileImageUrl],[LinkUrl],[ButtonText],[DisplayOrder],[IsActive],[Type],[StartDate],[EndDate],[CreatedAt],[UpdatedAt]) VALUES
(1, N'Summer Sale 2026',      N'Up to 50% off on selected items',  N'/uploads/banners/summer-desktop.jpg', N'/uploads/banners/summer-mobile.jpg', N'/category/men',  N'Shop Now',  1, 1, 0, DATEADD(DAY, -7, @UtcNow), DATEADD(DAY, 30, @UtcNow), @UtcNow, NULL),
(2, N'New Arrivals Weekly',   N'Fresh styles every Monday',        N'/uploads/banners/newarrivals-desktop.jpg', N'/uploads/banners/newarrivals-mobile.jpg', N'/products', N'Explore', 2, 1, 0, @UtcNow, DATEADD(DAY, 60, @UtcNow), @UtcNow, NULL),
(3, N'Eid Collection',        N'Premium ethnic wear for Eid',      N'/uploads/banners/eid-desktop.jpg',   N'/uploads/banners/eid-mobile.jpg',  N'/collection/festive-saree', N'View Collection', 3, 1, 1, DATEADD(DAY, 14, @UtcNow), DATEADD(DAY, 45, @UtcNow), @UtcNow, NULL),
(4, N'Free Shipping Promo',   N'On orders above 3000 BDT',        N'/uploads/banners/freeship-desktop.jpg',N'/uploads/banners/freeship-mobile.jpg',N'/products', N'Shop Free', 4, 1, 2, @UtcNow, DATEADD(DAY, 90, @UtcNow), @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[HeroBanners] OFF;

SET IDENTITY_INSERT [dbo].[NavigationMenus] ON;
INSERT INTO [dbo].[NavigationMenus] ([Id],[Title],[Url],[DisplayOrder],[IsActive],[IsMegaMenu],[Icon],[CategoryId],[ParentMenuId],[CreatedAt],[UpdatedAt]) VALUES
(1, N'Men',          N'/category/men',          1, 1, 1, N'ri-men-line',      1, NULL, @UtcNow, NULL),
(2, N'Women',        N'/category/women',        2, 1, 1, N'ri-women-line',    2, NULL, @UtcNow, NULL),
(3, N'Children',     N'/category/children',     3, 1, 1, N'ri-bear-smile-line',3, NULL, @UtcNow, NULL),
(4, N'Accessories',  N'/category/accessories',  4, 1, 0, N'ri-gem-line',      4, NULL, @UtcNow, NULL),
(5, N'T-Shirts',     N'/category/men/tshirts',  5, 1, 0, NULL,                NULL, 1,    @UtcNow, NULL),
(6, N'Pants',        N'/category/men/pants',    6, 1, 0, NULL,                NULL, 1,    @UtcNow, NULL),
(7, N'Kurtis',       N'/category/women/kurtis', 7, 1, 0, NULL,                NULL, 2,    @UtcNow, NULL),
(8, N'Sarees',       N'/category/women/sarees', 8, 1, 0, NULL,                NULL, 2,    @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[NavigationMenus] OFF;

SET IDENTITY_INSERT [dbo].[BlockedIps] ON;
INSERT INTO [dbo].[BlockedIps] ([Id],[IpAddress],[Reason],[BlockedAt],[BlockedBy],[CreatedAt],[UpdatedAt]) VALUES
(1, N'192.168.1.100', N'Spam bot detected',       DATEADD(DAY, -5, @UtcNow), N'system', @UtcNow, NULL),
(2, N'10.0.0.55',     N'Multiple failed logins',  DATEADD(DAY, -2, @UtcNow), N'admin',  @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[BlockedIps] OFF;

SET IDENTITY_INSERT [dbo].[DailyTraffics] ON;
INSERT INTO [dbo].[DailyTraffics] ([Id],[Date],[PageViews],[UniqueVisitors],[CreatedAt],[UpdatedAt]) VALUES
(2, DATEADD(DAY, -6, @UtcNow), 1250, 420, @UtcNow, NULL),
(3, DATEADD(DAY, -5, @UtcNow), 1580, 510, @UtcNow, NULL),
(4, DATEADD(DAY, -4, @UtcNow), 1320, 440, @UtcNow, NULL),
(5, DATEADD(DAY, -3, @UtcNow), 2100, 680, @UtcNow, NULL),
(6, DATEADD(DAY, -2, @UtcNow), 1890, 620, @UtcNow, NULL),
(7, DATEADD(DAY, -1, @UtcNow), 2340, 750, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[DailyTraffics] OFF;

-- ============================================================
-- STEP 7: Carts + CartItems
-- ============================================================

SET IDENTITY_INSERT [dbo].[Carts] ON;
INSERT INTO [dbo].[Carts] ([Id],[UserId],[SessionId],[GuestId],[CreatedAt],[UpdatedAt]) VALUES
(2, NULL, N'session_guest_001', N'guest_hash_abc123', @UtcNow, NULL),
(3, @AdminId, NULL, NULL, @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[Carts] OFF;

SET IDENTITY_INSERT [dbo].[CartItems] ON;
INSERT INTO [dbo].[CartItems] ([Id],[CartId],[ProductId],[Quantity],[Size],[CreatedAt],[UpdatedAt]) VALUES
(1, 2, 1,  2, N'M',     @UtcNow, NULL),
(2, 2, 6,  1, N'S',     @UtcNow, NULL),
(3, 3, 4,  1, N'32',    @UtcNow, NULL),
(4, 3, 13, 1, N'Free',  @UtcNow, NULL),
(5, 3, 8,  1, N'Free',  @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[CartItems] OFF;

-- ============================================================
-- STEP 8: Orders + OrderItems + OrderNotes + OrderLogs
-- ============================================================

SET IDENTITY_INSERT [dbo].[Orders] ON;
INSERT INTO [dbo].[Orders] ([Id],[OrderNumber],[CustomerName],[CustomerPhone],[ShippingAddress],[City],[Area],[SubTotal],[Tax],[ShippingCost],[Discount],[AdvancePayment],[Total],[DeliveryMethodId],[Status],[IsPreOrder],[AdminNote],[CustomerNote],[SourcePageId],[SocialMediaSourceId],[CreatedAt],[UpdatedAt]) VALUES
(1,  N'ARM-2026-0001', N'Rahim Uddin',    N'01712345678', N'House 12, Road 5, Gulshan',      N'Dhaka',      N'Gulshan',    998.00,  0.00,  60.00,  0.00,  0.00,   1058.00, 1, 5, 0, NULL, NULL,                  1, NULL, DATEADD(DAY, -10, @UtcNow), DATEADD(DAY, -8, @UtcNow)),
(2,  N'ARM-2026-0002', N'Fatema Begum',   N'01812345678', N'House 8, Road 10, Banani',       N'Dhaka',      N'Banani',     4698.00, 0.00,  60.00,  500.00, 1000.00, 4258.00, 2, 4, 0, NULL, N'Gift wrap please',     2, 1,   DATEADD(DAY, -8, @UtcNow), DATEADD(DAY, -5, @UtcNow)),
(3,  N'ARM-2026-0003', N'Karim Ahmed',    N'01912345678', N'Flat 3B, Tower 2, Uttara',       N'Dhaka',      N'Uttara',     1299.00, 0.00,  120.00, 0.00,  0.00,   1419.00, 2, 1, 0, NULL, NULL,                  3, NULL, DATEADD(DAY, -6, @UtcNow), NULL),
(4,  N'ARM-2026-0004', N'Tanvir Hassan',  N'01612345678', N'House 45, Lane 3, Agrabad',      N'Chittagong', N'Agrabad',    3499.00, 0.00,  60.00,  0.00,  0.00,   3559.00, 1, 3, 0, NULL, NULL,                  1, 3,   DATEADD(DAY, -5, @UtcNow), DATEADD(DAY, -3, @UtcNow)),
(5,  N'ARM-2026-0005', N'Nusrat Jahan',   N'01512345678', N'House 7, Road 8, Dhanmondi',     N'Dhaka',      N'Dhanmondi',  2398.00, 0.00,  60.00,  200.00, 0.00,   2258.00, 1, 2, 0, NULL, NULL,                  4, 2,   DATEADD(DAY, -4, @UtcNow), DATEADD(DAY, -2, @UtcNow)),
(6,  N'ARM-2026-0006', N'Sabrina Akter',  N'01312345678', N'Flat 5A, Block C, Mirpur',       N'Dhaka',      N'Mirpur',     399.00,  0.00,  60.00,  0.00,  0.00,    459.00, 1, 0, 0, NULL, NULL,                  2, NULL, DATEADD(DAY, -2, @UtcNow), NULL),
(7,  N'ARM-2026-0007', N'Mahmudul Hasan', N'01412345678', N'House 22, Road 2, Boalia',       N'Rajshahi',   N'Boalia',     4498.00, 0.00,  120.00, 0.00,  1500.00, 4618.00, 2, 8, 1, NULL, N'Pre-order winter jacket', 1, NULL, DATEADD(DAY, -1, @UtcNow), NULL),
(8,  N'ARM-2026-0008', N'Arifur Rahman',  N'01112345678', N'House 9, Road 15, Mohammadpur',  N'Dhaka',      N'Mohammadpur',1499.00, 0.00,  60.00,  0.00,  0.00,   1559.00, 3, 6, 0, N'Customer cancelled', NULL, 1, NULL, DATEADD(DAY, -1, @UtcNow), @UtcNow);
SET IDENTITY_INSERT [dbo].[Orders] OFF;

SET IDENTITY_INSERT [dbo].[OrderItems] ON;
INSERT INTO [dbo].[OrderItems] ([Id],[OrderId],[ProductId],[ProductName],[Size],[ImageUrl],[UnitPrice],[Quantity],[CreatedAt],[UpdatedAt]) VALUES
(1,  1, 1,  N'Classic Cotton T-Shirt',      N'M',    N'/uploads/products/classic-cotton-tshirt-main.jpg', 499.00,  2, DATEADD(DAY, -10, @UtcNow), NULL),
(2,  2, 6,  N'Embroidered Cotton Kurti',     N'S',    N'/uploads/products/embroidered-kurti-main.jpg',   1199.00, 1, DATEADD(DAY, -8, @UtcNow), NULL),
(3,  2, 8,  N'Banarasi Silk Saree',          N'Free', N'/uploads/products/banarasi-saree-main.jpg',       3499.00, 1, DATEADD(DAY, -8, @UtcNow), NULL),
(4,  2, 10, N'Boys Graphic T-Shirt',         N'6Y',   N'/uploads/products/boys-graphic-main.jpg',         399.00,  1, DATEADD(DAY, -8, @UtcNow), NULL),
(5,  3, 4,  N'Slim Fit Denim Jeans',         N'32',   N'/uploads/products/slim-fit-denim-main.jpg',       1299.00, 1, DATEADD(DAY, -6, @UtcNow), NULL),
(6,  4, 8,  N'Banarasi Silk Saree',          N'Free', N'/uploads/products/banarasi-saree-main.jpg',       3499.00, 1, DATEADD(DAY, -5, @UtcNow), NULL),
(7,  5, 12, N'Leather Crossbody Bag',        N'Free', N'/uploads/products/leather-bag-main.jpg',           2499.00, 1, DATEADD(DAY, -4, @UtcNow), NULL),
(8,  5, 13, N'Minimalist Analog Watch',      N'Free', N'/uploads/products/minimalist-watch-main.jpg',      1999.00, 1, DATEADD(DAY, -4, @UtcNow), NULL),
(9,  6, 2,  N'Graphic Print Tee',            N'S',    N'/uploads/products/graphic-print-tee-main.jpg',     599.00, 1, DATEADD(DAY, -2, @UtcNow), NULL),
(10, 7, 4,  N'Slim Fit Denim Jeans',         N'30',   N'/uploads/products/slim-fit-denim-main.jpg',       1299.00, 1, DATEADD(DAY, -1, @UtcNow), NULL),
(11, 7, 14, N'Upcoming Winter Jacket',       N'M',    N'/uploads/products/winter-jacket-main.jpg',        2499.00, 1, DATEADD(DAY, -1, @UtcNow), NULL),
(12, 8, 15, N'Men Casual Combo Set',         N'M',    N'/uploads/products/combo-set-main.jpg',            1499.00, 1, DATEADD(DAY, -1, @UtcNow), NULL);
SET IDENTITY_INSERT [dbo].[OrderItems] OFF;

SET IDENTITY_INSERT [dbo].[OrderNotes] ON;
INSERT INTO [dbo].[OrderNotes] ([Id],[OrderId],[AdminName],[Content],[CreatedAt],[UpdatedAt]) VALUES
(1, 1, N'Admin', N'Order delivered successfully. Customer confirmed receipt.',       DATEADD(DAY, -8, @UtcNow), NULL),
(2, 2, N'Admin', N'Shipped via pathao courier. Tracking: PT-2026-88123.',           DATEADD(DAY, -6, @UtcNow), NULL),
(3, 4, N'Admin', N'Order packed and ready for shipment.',                            DATEADD(DAY, -4, @UtcNow), NULL),
(4, 6, N'Admin', N'New order received. Awaiting confirmation.',                      DATEADD(DAY, -2, @UtcNow), NULL),
(5, 7, N'Admin', N'Pre-order item. Customer informed about 2-week lead time.',       DATEADD(DAY, -1, @UtcNow), NULL),
(6, 8, N'Admin', N'Customer requested cancellation. Refund initiated via bKash.',    @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[OrderNotes] OFF;

SET IDENTITY_INSERT [dbo].[OrderLogs] ON;
INSERT INTO [dbo].[OrderLogs] ([Id],[OrderId],[StatusFrom],[StatusTo],[ChangedBy],[Note],[CreatedAt],[UpdatedAt]) VALUES
(1,  1, N'Pending',    N'Confirmed',  N'Admin',  N'Payment verified',                         DATEADD(DAY, -10, @UtcNow), NULL),
(2,  1, N'Confirmed',  N'Processing', N'Admin',  N'Started processing',                        DATEADD(DAY, -9, @UtcNow), NULL),
(3,  1, N'Processing', N'Shipped',    N'Admin',  N'Shipped via pathao',                        DATEADD(DAY, -9, @UtcNow), NULL),
(4,  1, N'Shipped',    N'Delivered',  N'System', N'Delivered and confirmed by customer',        DATEADD(DAY, -8, @UtcNow), NULL),
(5,  2, N'Pending',    N'Confirmed',  N'Admin',  N'Payment confirmed via bKash',               DATEADD(DAY, -7, @UtcNow), NULL),
(6,  2, N'Confirmed',  N'Shipped',    N'Admin',  N'Shipped via pathao courier',                DATEADD(DAY, -6, @UtcNow), NULL),
(7,  4, N'Pending',    N'Confirmed',  N'Admin',  N'Pre-order confirmed',                       DATEADD(DAY, -4, @UtcNow), NULL),
(8,  4, N'Confirmed',  N'Packed',     N'Admin',  N'Items packed',                              DATEADD(DAY, -3, @UtcNow), NULL),
(9,  5, N'Pending',    N'Confirmed',  N'Admin',  N'Order confirmed',                           DATEADD(DAY, -3, @UtcNow), NULL),
(10, 5, N'Confirmed',  N'Processing', N'Admin',  N'Processing order',                          DATEADD(DAY, -2, @UtcNow), NULL),
(11, 7, N'Pending',    N'Hold',       N'Admin',  N'Pre-order — waiting for stock',             DATEADD(DAY, -1, @UtcNow), NULL),
(12, 8, N'Pending',    N'Cancelled',  N'Admin',  N'Customer cancelled via phone',              @UtcNow, NULL);
SET IDENTITY_INSERT [dbo].[OrderLogs] OFF;

-- ============================================================
-- STEP 9: RefreshTokens + AdminActivityLogs
-- ============================================================

SET IDENTITY_INSERT [dbo].[RefreshTokens] ON;
INSERT INTO [dbo].[RefreshTokens] ([Id],[UserId],[RefreshToken],[DeviceInfo],[IpAddress],[ExpiresAt],[IsRevoked],[CreatedAt],[UpdatedAt]) VALUES
(1, @AdminId, N'refresh_token_abc123def456', N'Chrome/Windows 11', N'192.168.1.10', DATEADD(DAY, 30, @UtcNow), 0, @UtcNow, NULL),
(2, @AdminId, N'refresh_token_xyz789ghi012', N'Firefox/Windows 11', N'192.168.1.10', DATEADD(DAY, -5, @UtcNow), 1, DATEADD(DAY, -25, @UtcNow), NULL);
SET IDENTITY_INSERT [dbo].[RefreshTokens] OFF;

SET IDENTITY_INSERT [dbo].[AdminActivityLogs] ON;
INSERT INTO [dbo].[AdminActivityLogs] ([Id],[UserId],[Action],[Details],[IpAddress],[PerformedByUserId],[CreatedAt],[UpdatedAt]) VALUES
(1, @AdminId, N'Login',          N'Admin logged in successfully',                     N'192.168.1.10', @AdminId, DATEADD(DAY, -5, @UtcNow), NULL),
(2, @AdminId, N'Product Create', N'Created product: Classic Cotton T-Shirt',          N'192.168.1.10', @AdminId, DATEADD(DAY, -4, @UtcNow), NULL),
(3, @AdminId, N'Order Update',   N'Updated order ARM-2026-0002 status to Shipped',    N'192.168.1.10', @AdminId, DATEADD(DAY, -3, @UtcNow), NULL),
(4, @AdminId, N'Review Approve', N'Approved 5 product reviews',                       N'192.168.1.10', @AdminId, DATEADD(DAY, -2, @UtcNow), NULL),
(5, @AdminId, N'Settings Update',N'Updated site settings: FreeShippingThreshold=3000',N'192.168.1.10', @AdminId, DATEADD(DAY, -1, @UtcNow), NULL);
SET IDENTITY_INSERT [dbo].[AdminActivityLogs] OFF;

PRINT '=== Seed data inserted successfully! ===';

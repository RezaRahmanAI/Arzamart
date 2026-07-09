IF OBJECT_ID(N'[dbo].[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [dbo].[__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[AspNetRoles] (
        [Id] nvarchar(450) NOT NULL,
        [Name] nvarchar(256) NULL,
        [NormalizedName] nvarchar(256) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[AspNetUsers] (
        [Id] nvarchar(450) NOT NULL,
        [FullName] nvarchar(max) NULL,
        [Phone] nvarchar(20) NULL,
        [Role] nvarchar(20) NOT NULL,
        [IsSuspicious] bit NOT NULL DEFAULT CAST(0 AS bit),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [PasswordSalt] nvarchar(max) NULL,
        [RefreshToken] nvarchar(max) NULL,
        [RefreshTokenExpiry] datetime2 NULL,
        [UserName] nvarchar(256) NULL,
        [NormalizedUserName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [NormalizedEmail] nvarchar(256) NULL,
        [EmailConfirmed] bit NOT NULL,
        [PasswordHash] nvarchar(max) NULL,
        [SecurityStamp] nvarchar(max) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [PhoneNumberConfirmed] bit NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [LockoutEnd] datetimeoffset NULL,
        [LockoutEnabled] bit NOT NULL,
        [AccessFailedCount] int NOT NULL,
        CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[BlockedIps] (
        [Id] int NOT NULL IDENTITY,
        [IpAddress] nvarchar(50) NOT NULL,
        [Reason] nvarchar(255) NULL,
        [BlockedAt] datetime2 NOT NULL,
        [BlockedBy] nvarchar(max) NULL,
        CONSTRAINT [PK_BlockedIps] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[Carts] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(max) NULL,
        [SessionId] nvarchar(100) NULL,
        [GuestId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Carts] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[Customers] (
        [Id] int NOT NULL IDENTITY,
        [Phone] nvarchar(450) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Address] nvarchar(max) NOT NULL,
        [IsSuspicious] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Customers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[DailyTraffics] (
        [Id] int NOT NULL IDENTITY,
        [Date] date NOT NULL,
        [PageViews] int NOT NULL,
        [UniqueVisitors] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_DailyTraffics] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[DeliveryMethods] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Cost] decimal(18,2) NOT NULL,
        [EstimatedDays] nvarchar(100) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_DeliveryMethods] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[HeroBanners] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(max) NULL,
        [Subtitle] nvarchar(max) NULL,
        [ImageUrl] nvarchar(max) NOT NULL,
        [MobileImageUrl] nvarchar(max) NULL,
        [LinkUrl] nvarchar(max) NULL,
        [ButtonText] nvarchar(max) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [Type] int NOT NULL,
        [StartDate] datetime2 NULL,
        [EndDate] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_HeroBanners] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[NavigationMenus] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(max) NOT NULL,
        [Url] nvarchar(max) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [IsMegaMenu] bit NOT NULL,
        [Icon] nvarchar(max) NULL,
        [CategoryId] int NULL,
        [ParentMenuId] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_NavigationMenus] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_NavigationMenus_NavigationMenus_ParentMenuId] FOREIGN KEY ([ParentMenuId]) REFERENCES [dbo].[NavigationMenus] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[Pages] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(max) NOT NULL,
        [Slug] nvarchar(max) NOT NULL,
        [Content] nvarchar(max) NULL,
        [MetaTitle] nvarchar(max) NULL,
        [MetaDescription] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Pages] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[SiteSettings] (
        [Id] int NOT NULL IDENTITY,
        [WebsiteName] nvarchar(100) NOT NULL,
        [LogoUrl] nvarchar(max) NULL,
        [ContactEmail] nvarchar(max) NULL,
        [ContactPhone] nvarchar(max) NULL,
        [Address] nvarchar(max) NULL,
        [FacebookUrl] nvarchar(max) NULL,
        [InstagramUrl] nvarchar(max) NULL,
        [TwitterUrl] nvarchar(max) NULL,
        [YoutubeUrl] nvarchar(max) NULL,
        [WhatsAppNumber] nvarchar(max) NULL,
        [FacebookPixelId] nvarchar(max) NULL,
        [GoogleTagId] nvarchar(max) NULL,
        [Currency] nvarchar(max) NULL,
        [FreeShippingThreshold] decimal(18,2) NOT NULL,
        [ShippingCharge] decimal(18,2) NOT NULL,
        [SizeGuideImageUrl] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_SiteSettings] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[SocialMediaSources] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_SocialMediaSources] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[SourcePages] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_SourcePages] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[SubCategories] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Slug] nvarchar(450) NOT NULL,
        [ImageUrl] nvarchar(max) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CategoryId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_SubCategories] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[AspNetRoleClaims] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[AspNetRoles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[AspNetUserClaims] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[AspNetUserLogins] (
        [LoginProvider] nvarchar(450) NOT NULL,
        [ProviderKey] nvarchar(450) NOT NULL,
        [ProviderDisplayName] nvarchar(max) NULL,
        [UserId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
        CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[AspNetUserRoles] (
        [UserId] nvarchar(450) NOT NULL,
        [RoleId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[AspNetRoles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[AspNetUserTokens] (
        [UserId] nvarchar(450) NOT NULL,
        [LoginProvider] nvarchar(450) NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
        CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[RefreshTokens] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [RefreshToken] nvarchar(500) NOT NULL,
        [DeviceInfo] nvarchar(max) NULL,
        [IpAddress] nvarchar(max) NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [IsRevoked] bit NOT NULL,
        [RevokedAt] datetime2 NULL,
        [ReplacedByToken] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RefreshTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[Orders] (
        [Id] int NOT NULL IDENTITY,
        [OrderNumber] nvarchar(450) NOT NULL,
        [CustomerName] nvarchar(max) NOT NULL,
        [CustomerPhone] nvarchar(max) NOT NULL,
        [ShippingAddress] nvarchar(max) NOT NULL,
        [City] nvarchar(max) NOT NULL,
        [Area] nvarchar(max) NOT NULL,
        [SubTotal] decimal(18,2) NOT NULL,
        [Tax] decimal(18,2) NOT NULL,
        [ShippingCost] decimal(18,2) NOT NULL,
        [Total] decimal(18,2) NOT NULL,
        [DeliveryMethodId] int NULL,
        [Status] int NOT NULL,
        [CreatedIp] nvarchar(max) NULL,
        [IsPreOrder] bit NOT NULL,
        [AdminNote] nvarchar(max) NULL,
        [SourcePageId] int NULL,
        [SocialMediaSourceId] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Orders_DeliveryMethods_DeliveryMethodId] FOREIGN KEY ([DeliveryMethodId]) REFERENCES [dbo].[DeliveryMethods] ([Id]),
        CONSTRAINT [FK_Orders_SocialMediaSources_SocialMediaSourceId] FOREIGN KEY ([SocialMediaSourceId]) REFERENCES [dbo].[SocialMediaSources] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Orders_SourcePages_SourcePageId] FOREIGN KEY ([SourcePageId]) REFERENCES [dbo].[SourcePages] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[Collections] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Slug] nvarchar(450) NOT NULL,
        [ImageUrl] nvarchar(max) NULL,
        [Description] nvarchar(max) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [SubCategoryId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Collections] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Collections_SubCategories_SubCategoryId] FOREIGN KEY ([SubCategoryId]) REFERENCES [dbo].[SubCategories] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[OrderLog] (
        [Id] int NOT NULL IDENTITY,
        [OrderId] int NOT NULL,
        [StatusFrom] nvarchar(max) NOT NULL,
        [StatusTo] nvarchar(max) NOT NULL,
        [ChangedBy] nvarchar(max) NULL,
        [Note] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_OrderLog] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OrderLog_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [dbo].[Orders] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[OrderNotes] (
        [Id] int NOT NULL IDENTITY,
        [OrderId] int NOT NULL,
        [AdminName] nvarchar(max) NOT NULL,
        [Content] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_OrderNotes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OrderNotes_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [dbo].[Orders] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[Products] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Slug] nvarchar(450) NOT NULL,
        [Description] nvarchar(max) NULL,
        [ShortDescription] nvarchar(max) NULL,
        [Sku] nvarchar(450) NOT NULL,
        [ImageUrl] nvarchar(max) NULL,
        [StockQuantity] int NOT NULL,
        [IsActive] bit NOT NULL,
        [ProductType] int NOT NULL,
        [IsNew] bit NOT NULL,
        [IsFeatured] bit NOT NULL,
        [MetaTitle] nvarchar(max) NULL,
        [MetaDescription] nvarchar(max) NULL,
        [FabricAndCare] nvarchar(max) NULL,
        [ShippingAndReturns] nvarchar(max) NULL,
        [Tier] nvarchar(max) NULL,
        [Tags] nvarchar(max) NULL,
        [SortOrder] int NOT NULL,
        [CategoryId] int NOT NULL,
        [SubCategoryId] int NULL,
        [CollectionId] int NULL,
        [IsBundle] bit NOT NULL,
        [BundleQuantity] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Products] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_Product_Name] CHECK (LEN(Name) > 0),
        CONSTRAINT [FK_Products_Collections_CollectionId] FOREIGN KEY ([CollectionId]) REFERENCES [dbo].[Collections] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Products_SubCategories_SubCategoryId] FOREIGN KEY ([SubCategoryId]) REFERENCES [dbo].[SubCategories] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[CartItems] (
        [Id] int NOT NULL IDENTITY,
        [CartId] int NOT NULL,
        [ProductId] int NOT NULL,
        [Quantity] int NOT NULL,
        [Size] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_CartItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CartItems_Carts_CartId] FOREIGN KEY ([CartId]) REFERENCES [dbo].[Carts] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CartItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[CustomLandingPageConfigs] (
        [Id] int NOT NULL IDENTITY,
        [ProductId] int NOT NULL,
        [RelativeTimerTotalMinutes] int NULL,
        [IsTimerVisible] bit NOT NULL,
        [HeaderTitle] nvarchar(max) NULL,
        [IsProductDetailsVisible] bit NOT NULL,
        [ProductDetailsTitle] nvarchar(max) NULL,
        [IsFabricVisible] bit NOT NULL,
        [IsDesignVisible] bit NOT NULL,
        [IsTrustBannerVisible] bit NOT NULL,
        [TrustBannerText] nvarchar(max) NULL,
        [FeaturedProductName] nvarchar(max) NULL,
        [PromoPrice] decimal(18,2) NULL,
        [OriginalPrice] decimal(18,2) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_CustomLandingPageConfigs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CustomLandingPageConfigs_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[OrderItems] (
        [Id] int NOT NULL IDENTITY,
        [OrderId] int NOT NULL,
        [ProductId] int NOT NULL,
        [ProductName] nvarchar(max) NOT NULL,
        [Size] nvarchar(max) NULL,
        [ImageUrl] nvarchar(max) NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        [Quantity] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_OrderItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OrderItems_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [dbo].[Orders] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_OrderItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[ProductImages] (
        [Id] int NOT NULL IDENTITY,
        [Url] nvarchar(max) NOT NULL,
        [AltText] nvarchar(max) NULL,
        [Label] nvarchar(max) NULL,
        [MediaType] nvarchar(max) NOT NULL,
        [IsMain] bit NOT NULL,
        [DisplayOrder] int NOT NULL,
        [ProductId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_ProductImages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProductImages_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[ProductVariants] (
        [Id] int NOT NULL IDENTITY,
        [Sku] nvarchar(max) NULL,
        [Size] nvarchar(max) NULL,
        [Price] decimal(18,2) NULL,
        [CompareAtPrice] decimal(18,2) NULL,
        [PurchaseRate] decimal(18,2) NULL,
        [StockQuantity] int NOT NULL,
        [IsActive] bit NOT NULL,
        [ProductId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_ProductVariants] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProductVariants_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[Reviews] (
        [Id] int NOT NULL IDENTITY,
        [ProductId] int NOT NULL,
        [CustomerName] nvarchar(max) NOT NULL,
        [CustomerAvatar] nvarchar(max) NULL,
        [Rating] int NOT NULL,
        [Comment] nvarchar(1000) NOT NULL,
        [Date] datetime2 NOT NULL,
        [IsVerifiedPurchase] bit NOT NULL,
        [IsFeatured] bit NOT NULL,
        [IsApproved] bit NOT NULL,
        [Likes] int NOT NULL,
        [ProductId1] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Reviews] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Reviews_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Reviews_Products_ProductId1] FOREIGN KEY ([ProductId1]) REFERENCES [dbo].[Products] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [dbo].[AspNetRoleClaims] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [RoleNameIndex] ON [dbo].[AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserClaims_UserId] ON [dbo].[AspNetUserClaims] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserLogins_UserId] ON [dbo].[AspNetUserLogins] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [dbo].[AspNetUserRoles] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [EmailIndex] ON [dbo].[AspNetUsers] ([NormalizedEmail]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_AspNetUsers_Phone] ON [dbo].[AspNetUsers] ([Phone]) WHERE [Phone] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UserNameIndex] ON [dbo].[AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CartItems_CartId] ON [dbo].[CartItems] ([CartId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CartItems_ProductId] ON [dbo].[CartItems] ([ProductId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Carts_SessionId] ON [dbo].[Carts] ([SessionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Collections_Slug] ON [dbo].[Collections] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Collections_SubCategoryId] ON [dbo].[Collections] ([SubCategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Customers_CreatedAt] ON [dbo].[Customers] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Customers_Phone] ON [dbo].[Customers] ([Phone]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CustomLandingPageConfigs_ProductId] ON [dbo].[CustomLandingPageConfigs] ([ProductId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_NavigationMenus_DisplayOrder] ON [dbo].[NavigationMenus] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_NavigationMenus_IsActive] ON [dbo].[NavigationMenus] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_NavigationMenus_ParentMenuId] ON [dbo].[NavigationMenus] ([ParentMenuId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OrderItems_OrderId] ON [dbo].[OrderItems] ([OrderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OrderItems_ProductId] ON [dbo].[OrderItems] ([ProductId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OrderLog_OrderId] ON [dbo].[OrderLog] ([OrderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OrderNotes_OrderId] ON [dbo].[OrderNotes] ([OrderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Orders_CreatedAt] ON [dbo].[Orders] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Orders_DeliveryMethodId] ON [dbo].[Orders] ([DeliveryMethodId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Orders_OrderNumber] ON [dbo].[Orders] ([OrderNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Orders_SocialMediaSourceId] ON [dbo].[Orders] ([SocialMediaSourceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Orders_SourcePageId] ON [dbo].[Orders] ([SourcePageId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Orders_Status] ON [dbo].[Orders] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ProductImages_ProductId] ON [dbo].[ProductImages] ([ProductId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Products_CategoryId] ON [dbo].[Products] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Products_CollectionId] ON [dbo].[Products] ([CollectionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Products_CreatedAt] ON [dbo].[Products] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Products_IsFeatured] ON [dbo].[Products] ([IsFeatured]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Products_IsNew] ON [dbo].[Products] ([IsNew]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Products_Sku] ON [dbo].[Products] ([Sku]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Products_Slug] ON [dbo].[Products] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Products_StockQuantity] ON [dbo].[Products] ([StockQuantity]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_Products_Storefront_Active] ON [dbo].[Products] ([IsActive], [CategoryId]) WHERE [IsActive] = 1');
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Products_SubCategoryId] ON [dbo].[Products] ([SubCategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ProductVariants_Price] ON [dbo].[ProductVariants] ([Price]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ProductVariants_ProductId] ON [dbo].[ProductVariants] ([ProductId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_RefreshToken] ON [dbo].[RefreshTokens] ([RefreshToken]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_UserId] ON [dbo].[RefreshTokens] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Reviews_ProductId] ON [dbo].[Reviews] ([ProductId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Reviews_ProductId1] ON [dbo].[Reviews] ([ProductId1]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_SubCategories_CategoryId] ON [dbo].[SubCategories] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SubCategories_Slug] ON [dbo].[SubCategories] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420020313_InitialCreate'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260420020313_InitialCreate', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260424040013_UpdateOrderSchema'
)
BEGIN
    ALTER TABLE [dbo].[Products] ADD [SizeChartUrl] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260424040013_UpdateOrderSchema'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [CustomerNote] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260424040013_UpdateOrderSchema'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260424040013_UpdateOrderSchema', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426101634_AddDiscountAndAdvancePaymentToOrder'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [AdvancePayment] decimal(18,2) NOT NULL DEFAULT 0.0;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426101634_AddDiscountAndAdvancePaymentToOrder'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [Discount] decimal(18,2) NOT NULL DEFAULT 0.0;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426101634_AddDiscountAndAdvancePaymentToOrder'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260426101634_AddDiscountAndAdvancePaymentToOrder', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    CREATE TABLE [dbo].[Categories] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Slug] nvarchar(450) NOT NULL,
        [ImageUrl] nvarchar(max) NULL,
        [MetaTitle] nvarchar(max) NULL,
        [MetaDescription] nvarchar(max) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [ParentId] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Categories] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Categories_Categories_ParentId] FOREIGN KEY ([ParentId]) REFERENCES [dbo].[Categories] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    CREATE INDEX [IX_Categories_ParentId] ON [dbo].[Categories] ([ParentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Categories_Slug] ON [dbo].[Categories] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    SET IDENTITY_INSERT dbo.Categories ON;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    INSERT INTO dbo.Categories (Id, Name, Slug, DisplayOrder, IsActive, CreatedAt) VALUES (1, 'Men', 'men', 1, 1, GETUTCDATE());
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    INSERT INTO dbo.Categories (Id, Name, Slug, DisplayOrder, IsActive, CreatedAt) VALUES (2, 'Women', 'women', 2, 1, GETUTCDATE());
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    INSERT INTO dbo.Categories (Id, Name, Slug, DisplayOrder, IsActive, CreatedAt) VALUES (3, 'Kids', 'kids', 3, 1, GETUTCDATE());
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    INSERT INTO dbo.Categories (Id, Name, Slug, DisplayOrder, IsActive, CreatedAt) VALUES (4, 'Accessories', 'accessories', 4, 1, GETUTCDATE());
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    SET IDENTITY_INSERT dbo.Categories OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    ALTER TABLE [dbo].[Products] ADD CONSTRAINT [FK_Products_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[Categories] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    ALTER TABLE [dbo].[SubCategories] ADD CONSTRAINT [FK_SubCategories_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[Categories] ([Id]) ON DELETE CASCADE;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426221209_FinalizeDynamicCategories'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260426221209_FinalizeDynamicCategories', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260429073927_AddClpFields'
)
BEGIN
    DROP INDEX [IX_Products_Sku] ON [dbo].[Products];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260429073927_AddClpFields'
)
BEGIN
    DECLARE @var nvarchar(max);
    SELECT @var = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[Products]') AND [c].[name] = N'Sku');
    IF @var IS NOT NULL EXEC(N'ALTER TABLE [dbo].[Products] DROP CONSTRAINT ' + @var + ';');
    ALTER TABLE [dbo].[Products] ALTER COLUMN [Sku] nvarchar(450) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260429073927_AddClpFields'
)
BEGIN
    ALTER TABLE [dbo].[CustomLandingPageConfigs] ADD [IsFeaturedOrderVisible] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260429073927_AddClpFields'
)
BEGIN
    ALTER TABLE [dbo].[CustomLandingPageConfigs] ADD [TrustBannerDescription] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260429073927_AddClpFields'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Products_Sku] ON [dbo].[Products] ([Sku]) WHERE [Sku] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260429073927_AddClpFields'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260429073927_AddClpFields', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260429220404_AddCustomerCityAndArea'
)
BEGIN
    ALTER TABLE [dbo].[Customers] ADD [Area] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260429220404_AddCustomerCityAndArea'
)
BEGIN
    ALTER TABLE [dbo].[Customers] ADD [City] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260429220404_AddCustomerCityAndArea'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260429220404_AddCustomerCityAndArea', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260430060159_AddMarqueeToCLP'
)
BEGIN
    ALTER TABLE [dbo].[CustomLandingPageConfigs] ADD [IsMarqueeVisible] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260430060159_AddMarqueeToCLP'
)
BEGIN
    ALTER TABLE [dbo].[CustomLandingPageConfigs] ADD [MarqueeText] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260430060159_AddMarqueeToCLP'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260430060159_AddMarqueeToCLP', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260430075235_AddPromoTextToCLP'
)
BEGIN
    ALTER TABLE [dbo].[CustomLandingPageConfigs] ADD [PromoText] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260430075235_AddPromoTextToCLP'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260430075235_AddPromoTextToCLP', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260430122953_AddFreeShippingThresholdToCLP'
)
BEGIN
    ALTER TABLE [dbo].[CustomLandingPageConfigs] ADD [FreeShippingThresholdQuantity] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260430122953_AddFreeShippingThresholdToCLP'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260430122953_AddFreeShippingThresholdToCLP', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260504131948_AddProductGroupFeature'
)
BEGIN
    ALTER TABLE [dbo].[Products] ADD [ProductGroupId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260504131948_AddProductGroupFeature'
)
BEGIN
    CREATE TABLE [dbo].[ComboItems] (
        [Id] int NOT NULL IDENTITY,
        [ComboProductId] int NOT NULL,
        [ProductId] int NOT NULL,
        [ProductVariantId] int NULL,
        [Quantity] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_ComboItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ComboItems_ProductVariants_ProductVariantId] FOREIGN KEY ([ProductVariantId]) REFERENCES [dbo].[ProductVariants] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ComboItems_Products_ComboProductId] FOREIGN KEY ([ComboProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ComboItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260504131948_AddProductGroupFeature'
)
BEGIN
    CREATE TABLE [dbo].[ProductGroups] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_ProductGroups] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260504131948_AddProductGroupFeature'
)
BEGIN
    CREATE INDEX [IX_Products_ProductGroupId] ON [dbo].[Products] ([ProductGroupId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260504131948_AddProductGroupFeature'
)
BEGIN
    CREATE INDEX [IX_ComboItems_ComboProductId] ON [dbo].[ComboItems] ([ComboProductId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260504131948_AddProductGroupFeature'
)
BEGIN
    CREATE INDEX [IX_ComboItems_ProductId] ON [dbo].[ComboItems] ([ProductId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260504131948_AddProductGroupFeature'
)
BEGIN
    CREATE INDEX [IX_ComboItems_ProductVariantId] ON [dbo].[ComboItems] ([ProductVariantId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260504131948_AddProductGroupFeature'
)
BEGIN
    ALTER TABLE [dbo].[Products] ADD CONSTRAINT [FK_Products_ProductGroups_ProductGroupId] FOREIGN KEY ([ProductGroupId]) REFERENCES [dbo].[ProductGroups] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260504131948_AddProductGroupFeature'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260504131948_AddProductGroupFeature', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260506032938_AddBundleSizeToProduct'
)
BEGIN
    ALTER TABLE [dbo].[Products] ADD [BundleSize] int NOT NULL DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260506032938_AddBundleSizeToProduct'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260506032938_AddBundleSizeToProduct', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509085516_AddStaffAllowedMenus'
)
BEGIN
    ALTER TABLE [dbo].[AspNetUsers] ADD [AllowedMenusJson] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509085516_AddStaffAllowedMenus'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260509085516_AddStaffAllowedMenus', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509100734_AddSectionsJsonToLandingPageConfig'
)
BEGIN
    DECLARE @var1 nvarchar(max);
    SELECT @var1 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[CustomLandingPageConfigs]') AND [c].[name] = N'IsMarqueeVisible');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[CustomLandingPageConfigs] DROP CONSTRAINT ' + @var1 + ';');
    ALTER TABLE [dbo].[CustomLandingPageConfigs] DROP COLUMN [IsMarqueeVisible];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509100734_AddSectionsJsonToLandingPageConfig'
)
BEGIN
    EXEC sp_rename N'[dbo].[CustomLandingPageConfigs].[MarqueeText]', N'SectionsJson', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509100734_AddSectionsJsonToLandingPageConfig'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260509100734_AddSectionsJsonToLandingPageConfig', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514064247_CleanUpReviewSchema'
)
BEGIN
    ALTER TABLE [dbo].[Reviews] DROP CONSTRAINT [FK_Reviews_Products_ProductId1];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514064247_CleanUpReviewSchema'
)
BEGIN
    DROP INDEX [IX_Reviews_ProductId1] ON [dbo].[Reviews];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514064247_CleanUpReviewSchema'
)
BEGIN
    DECLARE @var2 nvarchar(max);
    SELECT @var2 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[Reviews]') AND [c].[name] = N'ProductId1');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[Reviews] DROP CONSTRAINT ' + @var2 + ';');
    ALTER TABLE [dbo].[Reviews] DROP COLUMN [ProductId1];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514064247_CleanUpReviewSchema'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260514064247_CleanUpReviewSchema', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260518022437_AddScreenshotUrlToReview'
)
BEGIN
    ALTER TABLE [dbo].[Reviews] ADD [ScreenshotUrl] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260518022437_AddScreenshotUrlToReview'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260518022437_AddScreenshotUrlToReview', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260518022828_MakeCommentOptionalInReview'
)
BEGIN
    DECLARE @var3 nvarchar(max);
    SELECT @var3 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[Reviews]') AND [c].[name] = N'Comment');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[Reviews] DROP CONSTRAINT ' + @var3 + ';');
    ALTER TABLE [dbo].[Reviews] ALTER COLUMN [Comment] nvarchar(1000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260518022828_MakeCommentOptionalInReview'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260518022828_MakeCommentOptionalInReview', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605012754_AddPasswordEncryptedColumn'
)
BEGIN
    ALTER TABLE [dbo].[AspNetUsers] ADD [PasswordEncrypted] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605012754_AddPasswordEncryptedColumn'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260605012754_AddPasswordEncryptedColumn', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605022824_AddAdminActivityLog'
)
BEGIN
    CREATE TABLE [dbo].[AdminActivityLogs] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [Action] nvarchar(100) NOT NULL,
        [Details] nvarchar(500) NULL,
        [IpAddress] nvarchar(50) NULL,
        [PerformedByUserId] nvarchar(450) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AdminActivityLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AdminActivityLogs_AspNetUsers_PerformedByUserId] FOREIGN KEY ([PerformedByUserId]) REFERENCES [dbo].[AspNetUsers] ([Id]),
        CONSTRAINT [FK_AdminActivityLogs_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605022824_AddAdminActivityLog'
)
BEGIN
    CREATE INDEX [IX_AdminActivityLogs_Action] ON [dbo].[AdminActivityLogs] ([Action]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605022824_AddAdminActivityLog'
)
BEGIN
    CREATE INDEX [IX_AdminActivityLogs_CreatedAt] ON [dbo].[AdminActivityLogs] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605022824_AddAdminActivityLog'
)
BEGIN
    CREATE INDEX [IX_AdminActivityLogs_PerformedByUserId] ON [dbo].[AdminActivityLogs] ([PerformedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605022824_AddAdminActivityLog'
)
BEGIN
    CREATE INDEX [IX_AdminActivityLogs_UserId] ON [dbo].[AdminActivityLogs] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605022824_AddAdminActivityLog'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260605022824_AddAdminActivityLog', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606045714_AddForceChangePasswordAndRemoveStaffTables'
)
BEGIN
    IF OBJECT_ID('dbo.role_permissions', 'U') IS NOT NULL DROP TABLE [dbo].[role_permissions]
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606045714_AddForceChangePasswordAndRemoveStaffTables'
)
BEGIN
    IF OBJECT_ID('dbo.staff_audit_log', 'U') IS NOT NULL DROP TABLE [dbo].[staff_audit_log]
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606045714_AddForceChangePasswordAndRemoveStaffTables'
)
BEGIN
    IF OBJECT_ID('dbo.permissions', 'U') IS NOT NULL DROP TABLE [dbo].[permissions]
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606045714_AddForceChangePasswordAndRemoveStaffTables'
)
BEGIN
    IF OBJECT_ID('dbo.staff_users', 'U') IS NOT NULL DROP TABLE [dbo].[staff_users]
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606045714_AddForceChangePasswordAndRemoveStaffTables'
)
BEGIN
    IF OBJECT_ID('dbo.modules', 'U') IS NOT NULL DROP TABLE [dbo].[modules]
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606045714_AddForceChangePasswordAndRemoveStaffTables'
)
BEGIN
    IF OBJECT_ID('dbo.roles', 'U') IS NOT NULL DROP TABLE [dbo].[roles]
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606045714_AddForceChangePasswordAndRemoveStaffTables'
)
BEGIN
    ALTER TABLE [dbo].[AspNetUsers] ADD [ForceChangePassword] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606045714_AddForceChangePasswordAndRemoveStaffTables'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260606045714_AddForceChangePasswordAndRemoveStaffTables', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608153734_UpdateOrderItem'
)
BEGIN
    ALTER TABLE [dbo].[OrderItems] DROP CONSTRAINT [FK_OrderItems_Products_ProductId];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608153734_UpdateOrderItem'
)
BEGIN
    DECLARE @var4 nvarchar(max);
    SELECT @var4 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[OrderItems]') AND [c].[name] = N'UpdatedAt');
    IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[OrderItems] DROP CONSTRAINT ' + @var4 + ';');
    ALTER TABLE [dbo].[OrderItems] DROP COLUMN [UpdatedAt];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608153734_UpdateOrderItem'
)
BEGIN
    ALTER TABLE [dbo].[BlockedIps] ADD [CreatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608153734_UpdateOrderItem'
)
BEGIN
    ALTER TABLE [dbo].[BlockedIps] ADD [UpdatedAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608153734_UpdateOrderItem'
)
BEGIN
    ALTER TABLE [dbo].[AdminActivityLogs] ADD [UpdatedAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608153734_UpdateOrderItem'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260608153734_UpdateOrderItem', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    ALTER TABLE [dbo].[OrderLog] DROP CONSTRAINT [FK_OrderLog_Orders_OrderId];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    DROP INDEX [IX_ProductImages_ProductId] ON [dbo].[ProductImages];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    DROP INDEX [IX_Collections_Slug] ON [dbo].[Collections];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    ALTER TABLE [dbo].[OrderLog] DROP CONSTRAINT [PK_OrderLog];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    DECLARE @var5 nvarchar(max);
    SELECT @var5 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[AspNetUsers]') AND [c].[name] = N'RefreshToken');
    IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[AspNetUsers] DROP CONSTRAINT ' + @var5 + ';');
    ALTER TABLE [dbo].[AspNetUsers] DROP COLUMN [RefreshToken];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    DECLARE @var6 nvarchar(max);
    SELECT @var6 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[AspNetUsers]') AND [c].[name] = N'RefreshTokenExpiry');
    IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[AspNetUsers] DROP CONSTRAINT ' + @var6 + ';');
    ALTER TABLE [dbo].[AspNetUsers] DROP COLUMN [RefreshTokenExpiry];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    EXEC sp_rename N'[dbo].[OrderLog]', N'OrderLogs', 'OBJECT';
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    EXEC sp_rename N'[dbo].[OrderLogs].[IX_OrderLog_OrderId]', N'IX_OrderLogs_OrderId', 'INDEX';
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    DECLARE @var7 nvarchar(max);
    SELECT @var7 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[Pages]') AND [c].[name] = N'Slug');
    IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[Pages] DROP CONSTRAINT ' + @var7 + ';');
    ALTER TABLE [dbo].[Pages] ALTER COLUMN [Slug] nvarchar(450) NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    DECLARE @var8 nvarchar(max);
    SELECT @var8 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[Orders]') AND [c].[name] = N'CustomerPhone');
    IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[Orders] DROP CONSTRAINT ' + @var8 + ';');
    ALTER TABLE [dbo].[Orders] ALTER COLUMN [CustomerPhone] nvarchar(450) NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    ALTER TABLE [dbo].[OrderItems] ADD [UpdatedAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    ALTER TABLE [dbo].[CustomLandingPageConfigs] ADD [IsMarqueeVisible] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    ALTER TABLE [dbo].[CustomLandingPageConfigs] ADD [MarqueeText] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    ALTER TABLE [dbo].[Customers] ADD [UserId] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    DECLARE @var9 nvarchar(max);
    SELECT @var9 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[Carts]') AND [c].[name] = N'UserId');
    IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[Carts] DROP CONSTRAINT ' + @var9 + ';');
    ALTER TABLE [dbo].[Carts] ALTER COLUMN [UserId] nvarchar(450) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    ALTER TABLE [dbo].[OrderLogs] ADD CONSTRAINT [PK_OrderLogs] PRIMARY KEY ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE INDEX [IX_SubCategories_DisplayOrder] ON [dbo].[SubCategories] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE INDEX [IX_Reviews_IsApproved] ON [dbo].[Reviews] ([IsApproved]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE INDEX [IX_Reviews_Rating] ON [dbo].[Reviews] ([Rating]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ProductImages_ProductId_IsMain] ON [dbo].[ProductImages] ([ProductId], [IsMain]) WHERE [IsMain] = 1');
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE INDEX [IX_Pages_IsActive] ON [dbo].[Pages] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Pages_Slug] ON [dbo].[Pages] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE INDEX [IX_Orders_CustomerPhone] ON [dbo].[Orders] ([CustomerPhone]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE INDEX [IX_Orders_IsPreOrder] ON [dbo].[Orders] ([IsPreOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE INDEX [IX_HeroBanners_DisplayOrder] ON [dbo].[HeroBanners] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE UNIQUE INDEX [IX_DailyTraffics_Date] ON [dbo].[DailyTraffics] ([Date]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE INDEX [IX_Collections_DisplayOrder] ON [dbo].[Collections] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Collections_Slug] ON [dbo].[Collections] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE INDEX [IX_Categories_DisplayOrder] ON [dbo].[Categories] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE INDEX [IX_Carts_UserId] ON [dbo].[Carts] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    CREATE UNIQUE INDEX [IX_BlockedIps_IpAddress] ON [dbo].[BlockedIps] ([IpAddress]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    ALTER TABLE [dbo].[Carts] ADD CONSTRAINT [FK_Carts_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    ALTER TABLE [dbo].[OrderItems] ADD CONSTRAINT [FK_OrderItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE CASCADE;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    ALTER TABLE [dbo].[OrderLogs] ADD CONSTRAINT [FK_OrderLogs_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [dbo].[Orders] ([Id]) ON DELETE CASCADE;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260626154621_final'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260626154621_final', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260627172147_RemoveIsBundleColumn'
)
BEGIN
    DECLARE @var10 nvarchar(max);
    SELECT @var10 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Products]') AND [c].[name] = N'IsBundle');
    IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [Products] DROP CONSTRAINT ' + @var10 + ';');
    ALTER TABLE [Products] DROP COLUMN [IsBundle];
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260627172147_RemoveIsBundleColumn'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260627172147_RemoveIsBundleColumn', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260628132325_AddMissingIndexes'
)
BEGIN
    CREATE INDEX [IX_Orders_Status_CreatedAt] ON [dbo].[Orders] ([Status], [CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260628132325_AddMissingIndexes'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260628132325_AddMissingIndexes', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260630094912_AddIncompleteOrderAttributionToOrders'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [Browser] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260630094912_AddIncompleteOrderAttributionToOrders'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [DeviceType] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260630094912_AddIncompleteOrderAttributionToOrders'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [Fbclid] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260630094912_AddIncompleteOrderAttributionToOrders'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [ReferrerUrl] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260630094912_AddIncompleteOrderAttributionToOrders'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [SessionId] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260630094912_AddIncompleteOrderAttributionToOrders'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [UtmAd] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260630094912_AddIncompleteOrderAttributionToOrders'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [UtmAdset] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260630094912_AddIncompleteOrderAttributionToOrders'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [UtmCampaign] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260630094912_AddIncompleteOrderAttributionToOrders'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [UtmSource] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260630094912_AddIncompleteOrderAttributionToOrders'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260630094912_AddIncompleteOrderAttributionToOrders', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    ALTER TABLE [dbo].[DeliveryMethods] ADD [DeliveryZoneId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE TABLE [dbo].[DeliveryZones] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(max) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_DeliveryZones] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE TABLE [dbo].[Divisions] (
        [Id] int NOT NULL IDENTITY,
        [NameEn] nvarchar(100) NOT NULL,
        [NameBn] nvarchar(100) NOT NULL,
        [BdGovtCode] nvarchar(10) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Divisions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE TABLE [dbo].[Districts] (
        [Id] int NOT NULL IDENTITY,
        [NameEn] nvarchar(100) NOT NULL,
        [NameBn] nvarchar(100) NOT NULL,
        [BdGovtCode] nvarchar(10) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [DivisionId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Districts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Districts_Divisions_DivisionId] FOREIGN KEY ([DivisionId]) REFERENCES [dbo].[Divisions] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE TABLE [dbo].[Upazilas] (
        [Id] int NOT NULL IDENTITY,
        [NameEn] nvarchar(100) NOT NULL,
        [NameBn] nvarchar(100) NOT NULL,
        [BdGovtCode] nvarchar(10) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [DistrictId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Upazilas] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Upazilas_Districts_DistrictId] FOREIGN KEY ([DistrictId]) REFERENCES [dbo].[Districts] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE TABLE [dbo].[DeliveryZoneUpazilas] (
        [Id] int NOT NULL IDENTITY,
        [DeliveryZoneId] int NOT NULL,
        [UpazilaId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_DeliveryZoneUpazilas] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DeliveryZoneUpazilas_DeliveryZones_DeliveryZoneId] FOREIGN KEY ([DeliveryZoneId]) REFERENCES [dbo].[DeliveryZones] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_DeliveryZoneUpazilas_Upazilas_UpazilaId] FOREIGN KEY ([UpazilaId]) REFERENCES [dbo].[Upazilas] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE INDEX [IX_DeliveryMethods_DeliveryZoneId] ON [dbo].[DeliveryMethods] ([DeliveryZoneId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE UNIQUE INDEX [IX_DeliveryZones_Name] ON [dbo].[DeliveryZones] ([Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE UNIQUE INDEX [IX_DeliveryZoneUpazilas_DeliveryZoneId_UpazilaId] ON [dbo].[DeliveryZoneUpazilas] ([DeliveryZoneId], [UpazilaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE INDEX [IX_DeliveryZoneUpazilas_UpazilaId] ON [dbo].[DeliveryZoneUpazilas] ([UpazilaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE INDEX [IX_Districts_DisplayOrder] ON [dbo].[Districts] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE INDEX [IX_Districts_DivisionId] ON [dbo].[Districts] ([DivisionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Districts_NameEn] ON [dbo].[Districts] ([NameEn]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE INDEX [IX_Divisions_DisplayOrder] ON [dbo].[Divisions] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Divisions_NameEn] ON [dbo].[Divisions] ([NameEn]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE INDEX [IX_Upazilas_DisplayOrder] ON [dbo].[Upazilas] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE INDEX [IX_Upazilas_DistrictId] ON [dbo].[Upazilas] ([DistrictId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    CREATE INDEX [IX_Upazilas_NameEn] ON [dbo].[Upazilas] ([NameEn]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    ALTER TABLE [dbo].[DeliveryMethods] ADD CONSTRAINT [FK_DeliveryMethods_DeliveryZones_DeliveryZoneId] FOREIGN KEY ([DeliveryZoneId]) REFERENCES [dbo].[DeliveryZones] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709045009_AddLocationManagement'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260709045009_AddLocationManagement', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709052356_AddOrderUpazilaId'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [UpazilaId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709052356_AddOrderUpazilaId'
)
BEGIN
    CREATE INDEX [IX_Orders_UpazilaId] ON [dbo].[Orders] ([UpazilaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709052356_AddOrderUpazilaId'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD CONSTRAINT [FK_Orders_Upazilas_UpazilaId] FOREIGN KEY ([UpazilaId]) REFERENCES [dbo].[Upazilas] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709052356_AddOrderUpazilaId'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260709052356_AddOrderUpazilaId', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709055255_LinkDeliveryMethodsToZones'
)
BEGIN

                UPDATE dm
                SET dm.DeliveryZoneId = dz.Id
                FROM DeliveryMethods dm
                INNER JOIN DeliveryZones dz ON dz.Name = 'Inside Dhaka'
                WHERE dm.Name = 'Inside Dhaka'
            
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709055255_LinkDeliveryMethodsToZones'
)
BEGIN

                UPDATE dm
                SET dm.DeliveryZoneId = dz.Id
                FROM DeliveryMethods dm
                INNER JOIN DeliveryZones dz ON dz.Name = 'Outside Dhaka'
                WHERE dm.Name IN ('Outside Dhaka', 'Dhaka Sub aria')
            
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709055255_LinkDeliveryMethodsToZones'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260709055255_LinkDeliveryMethodsToZones', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709071646_AddLocationIdsToCustomerAndOrder'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260709071646_AddLocationIdsToCustomerAndOrder', N'10.0.0');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [DistrictId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD [DivisionId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    ALTER TABLE [dbo].[Customers] ADD [DistrictId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    ALTER TABLE [dbo].[Customers] ADD [DivisionId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    ALTER TABLE [dbo].[Customers] ADD [UpazilaId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    CREATE INDEX [IX_Orders_DistrictId] ON [dbo].[Orders] ([DistrictId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    CREATE INDEX [IX_Orders_DivisionId] ON [dbo].[Orders] ([DivisionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    CREATE INDEX [IX_Customers_DistrictId] ON [dbo].[Customers] ([DistrictId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    CREATE INDEX [IX_Customers_DivisionId] ON [dbo].[Customers] ([DivisionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    CREATE INDEX [IX_Customers_UpazilaId] ON [dbo].[Customers] ([UpazilaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    ALTER TABLE [dbo].[Customers] ADD CONSTRAINT [FK_Customers_Districts_DistrictId] FOREIGN KEY ([DistrictId]) REFERENCES [dbo].[Districts] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    ALTER TABLE [dbo].[Customers] ADD CONSTRAINT [FK_Customers_Divisions_DivisionId] FOREIGN KEY ([DivisionId]) REFERENCES [dbo].[Divisions] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    ALTER TABLE [dbo].[Customers] ADD CONSTRAINT [FK_Customers_Upazilas_UpazilaId] FOREIGN KEY ([UpazilaId]) REFERENCES [dbo].[Upazilas] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD CONSTRAINT [FK_Orders_Districts_DistrictId] FOREIGN KEY ([DistrictId]) REFERENCES [dbo].[Districts] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    ALTER TABLE [dbo].[Orders] ADD CONSTRAINT [FK_Orders_Divisions_DivisionId] FOREIGN KEY ([DivisionId]) REFERENCES [dbo].[Divisions] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260709105707_FixOrderLocationColumns'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260709105707_FixOrderLocationColumns', N'10.0.0');
END;

COMMIT;
GO


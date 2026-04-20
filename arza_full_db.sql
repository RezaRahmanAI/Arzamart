IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [dbo].[AspNetRoles] (
    [Id] nvarchar(450) NOT NULL,
    [Name] nvarchar(256) NULL,
    [NormalizedName] nvarchar(256) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
);
GO

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
GO

CREATE TABLE [dbo].[BlockedIps] (
    [Id] int NOT NULL IDENTITY,
    [IpAddress] nvarchar(50) NOT NULL,
    [Reason] nvarchar(255) NULL,
    [BlockedAt] datetime2 NOT NULL,
    [BlockedBy] nvarchar(max) NULL,
    CONSTRAINT [PK_BlockedIps] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [dbo].[Carts] (
    [Id] int NOT NULL IDENTITY,
    [UserId] nvarchar(max) NULL,
    [SessionId] nvarchar(100) NULL,
    [GuestId] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Carts] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [dbo].[Categories] (
    [Id] int NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Slug] nvarchar(450) NOT NULL,
    [Icon] nvarchar(max) NULL,
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
GO

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
GO

CREATE TABLE [dbo].[DailyTraffics] (
    [Id] int NOT NULL IDENTITY,
    [Date] date NOT NULL,
    [PageViews] int NOT NULL,
    [UniqueVisitors] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_DailyTraffics] PRIMARY KEY ([Id])
);
GO

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
GO

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
GO

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
GO

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
GO

CREATE TABLE [dbo].[SocialMediaSources] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_SocialMediaSources] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [dbo].[SourcePages] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_SourcePages] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [dbo].[AspNetRoleClaims] (
    [Id] int NOT NULL IDENTITY,
    [RoleId] nvarchar(450) NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[AspNetRoles] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [dbo].[AspNetUserClaims] (
    [Id] int NOT NULL IDENTITY,
    [UserId] nvarchar(450) NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [dbo].[AspNetUserLogins] (
    [LoginProvider] nvarchar(450) NOT NULL,
    [ProviderKey] nvarchar(450) NOT NULL,
    [ProviderDisplayName] nvarchar(max) NULL,
    [UserId] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
    CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [dbo].[AspNetUserRoles] (
    [UserId] nvarchar(450) NOT NULL,
    [RoleId] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[AspNetRoles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [dbo].[AspNetUserTokens] (
    [UserId] nvarchar(450) NOT NULL,
    [LoginProvider] nvarchar(450) NOT NULL,
    [Name] nvarchar(450) NOT NULL,
    [Value] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
    CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

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
GO

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
    CONSTRAINT [FK_NavigationMenus_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[Categories] ([Id]),
    CONSTRAINT [FK_NavigationMenus_NavigationMenus_ParentMenuId] FOREIGN KEY ([ParentMenuId]) REFERENCES [dbo].[NavigationMenus] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [dbo].[SubCategories] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Slug] nvarchar(450) NOT NULL,
    [ImageUrl] nvarchar(max) NULL,
    [Description] nvarchar(max) NULL,
    [DisplayOrder] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CategoryId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_SubCategories] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SubCategories_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[Categories] ([Id]) ON DELETE CASCADE
);
GO

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
    [SteadfastConsignmentId] bigint NULL,
    [SteadfastTrackingCode] nvarchar(max) NULL,
    [SteadfastStatus] nvarchar(max) NULL,
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
GO

CREATE TABLE [dbo].[Collections] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Slug] nvarchar(450) NOT NULL,
    [ImageUrl] nvarchar(max) NULL,
    [Description] nvarchar(max) NULL,
    [DisplayOrder] int NOT NULL,
    [IsActive] bit NOT NULL,
    [SubCategoryId] int NOT NULL,
    [CategoryId] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Collections] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Collections_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[Categories] ([Id]),
    CONSTRAINT [FK_Collections_SubCategories_SubCategoryId] FOREIGN KEY ([SubCategoryId]) REFERENCES [dbo].[SubCategories] ([Id]) ON DELETE CASCADE
);
GO

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
GO

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
GO

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
    CONSTRAINT [FK_Products_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[Categories] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Products_Collections_CollectionId] FOREIGN KEY ([CollectionId]) REFERENCES [dbo].[Collections] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Products_SubCategories_SubCategoryId] FOREIGN KEY ([SubCategoryId]) REFERENCES [dbo].[SubCategories] ([Id]) ON DELETE NO ACTION
);
GO

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
GO

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
GO

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
GO

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
GO

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
GO

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
GO

CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [dbo].[AspNetRoleClaims] ([RoleId]);
GO

CREATE UNIQUE INDEX [RoleNameIndex] ON [dbo].[AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL;
GO

CREATE INDEX [IX_AspNetUserClaims_UserId] ON [dbo].[AspNetUserClaims] ([UserId]);
GO

CREATE INDEX [IX_AspNetUserLogins_UserId] ON [dbo].[AspNetUserLogins] ([UserId]);
GO

CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [dbo].[AspNetUserRoles] ([RoleId]);
GO

CREATE INDEX [EmailIndex] ON [dbo].[AspNetUsers] ([NormalizedEmail]);
GO

CREATE UNIQUE INDEX [IX_AspNetUsers_Phone] ON [dbo].[AspNetUsers] ([Phone]) WHERE [Phone] IS NOT NULL;
GO

CREATE UNIQUE INDEX [UserNameIndex] ON [dbo].[AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL;
GO

CREATE INDEX [IX_CartItems_CartId] ON [dbo].[CartItems] ([CartId]);
GO

CREATE INDEX [IX_CartItems_ProductId] ON [dbo].[CartItems] ([ProductId]);
GO

CREATE INDEX [IX_Carts_SessionId] ON [dbo].[Carts] ([SessionId]);
GO

CREATE INDEX [IX_Categories_DisplayOrder] ON [dbo].[Categories] ([DisplayOrder]);
GO

CREATE INDEX [IX_Categories_ParentId] ON [dbo].[Categories] ([ParentId]);
GO

CREATE UNIQUE INDEX [IX_Categories_Slug] ON [dbo].[Categories] ([Slug]);
GO

CREATE INDEX [IX_Collections_CategoryId] ON [dbo].[Collections] ([CategoryId]);
GO

CREATE INDEX [IX_Collections_Slug] ON [dbo].[Collections] ([Slug]);
GO

CREATE INDEX [IX_Collections_SubCategoryId] ON [dbo].[Collections] ([SubCategoryId]);
GO

CREATE INDEX [IX_Customers_CreatedAt] ON [dbo].[Customers] ([CreatedAt]);
GO

CREATE UNIQUE INDEX [IX_Customers_Phone] ON [dbo].[Customers] ([Phone]);
GO

CREATE INDEX [IX_CustomLandingPageConfigs_ProductId] ON [dbo].[CustomLandingPageConfigs] ([ProductId]);
GO

CREATE INDEX [IX_NavigationMenus_CategoryId] ON [dbo].[NavigationMenus] ([CategoryId]);
GO

CREATE INDEX [IX_NavigationMenus_DisplayOrder] ON [dbo].[NavigationMenus] ([DisplayOrder]);
GO

CREATE INDEX [IX_NavigationMenus_IsActive] ON [dbo].[NavigationMenus] ([IsActive]);
GO

CREATE INDEX [IX_NavigationMenus_ParentMenuId] ON [dbo].[NavigationMenus] ([ParentMenuId]);
GO

CREATE INDEX [IX_OrderItems_OrderId] ON [dbo].[OrderItems] ([OrderId]);
GO

CREATE INDEX [IX_OrderItems_ProductId] ON [dbo].[OrderItems] ([ProductId]);
GO

CREATE INDEX [IX_OrderLog_OrderId] ON [dbo].[OrderLog] ([OrderId]);
GO

CREATE INDEX [IX_OrderNotes_OrderId] ON [dbo].[OrderNotes] ([OrderId]);
GO

CREATE INDEX [IX_Orders_CreatedAt] ON [dbo].[Orders] ([CreatedAt]);
GO

CREATE INDEX [IX_Orders_DeliveryMethodId] ON [dbo].[Orders] ([DeliveryMethodId]);
GO

CREATE INDEX [IX_Orders_OrderNumber] ON [dbo].[Orders] ([OrderNumber]);
GO

CREATE INDEX [IX_Orders_SocialMediaSourceId] ON [dbo].[Orders] ([SocialMediaSourceId]);
GO

CREATE INDEX [IX_Orders_SourcePageId] ON [dbo].[Orders] ([SourcePageId]);
GO

CREATE INDEX [IX_Orders_Status] ON [dbo].[Orders] ([Status]);
GO

CREATE INDEX [IX_ProductImages_ProductId] ON [dbo].[ProductImages] ([ProductId]);
GO

CREATE INDEX [IX_Products_CategoryId] ON [dbo].[Products] ([CategoryId]);
GO

CREATE INDEX [IX_Products_CollectionId] ON [dbo].[Products] ([CollectionId]);
GO

CREATE INDEX [IX_Products_CreatedAt] ON [dbo].[Products] ([CreatedAt]);
GO

CREATE INDEX [IX_Products_IsFeatured] ON [dbo].[Products] ([IsFeatured]);
GO

CREATE INDEX [IX_Products_IsNew] ON [dbo].[Products] ([IsNew]);
GO

CREATE UNIQUE INDEX [IX_Products_Sku] ON [dbo].[Products] ([Sku]);
GO

CREATE UNIQUE INDEX [IX_Products_Slug] ON [dbo].[Products] ([Slug]);
GO

CREATE INDEX [IX_Products_StockQuantity] ON [dbo].[Products] ([StockQuantity]);
GO

CREATE INDEX [IX_Products_Storefront_Active] ON [dbo].[Products] ([IsActive], [CategoryId]) WHERE [IsActive] = 1;
GO

CREATE INDEX [IX_Products_SubCategoryId] ON [dbo].[Products] ([SubCategoryId]);
GO

CREATE INDEX [IX_ProductVariants_Price] ON [dbo].[ProductVariants] ([Price]);
GO

CREATE INDEX [IX_ProductVariants_ProductId] ON [dbo].[ProductVariants] ([ProductId]);
GO

CREATE INDEX [IX_RefreshTokens_RefreshToken] ON [dbo].[RefreshTokens] ([RefreshToken]);
GO

CREATE INDEX [IX_RefreshTokens_UserId] ON [dbo].[RefreshTokens] ([UserId]);
GO

CREATE INDEX [IX_Reviews_ProductId] ON [dbo].[Reviews] ([ProductId]);
GO

CREATE INDEX [IX_Reviews_ProductId1] ON [dbo].[Reviews] ([ProductId1]);
GO

CREATE INDEX [IX_SubCategories_CategoryId] ON [dbo].[SubCategories] ([CategoryId]);
GO

CREATE UNIQUE INDEX [IX_SubCategories_Slug] ON [dbo].[SubCategories] ([Slug]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260419155113_InitialCreate', N'8.0.12');
GO

COMMIT;
GO


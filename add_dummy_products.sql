SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
SET QUOTED_IDENTIFIER ON;

DECLARE @CategoryId INT = 4;
DECLARE @Now DATETIME2 = GETUTCDATE();
-- Dummy 1
INSERT INTO [dbo].[Products] (Name, Slug, Description, ShortDescription, Sku, ImageUrl, StockQuantity, IsActive, ProductType, IsNew, IsFeatured, CategoryId, SortOrder, IsBundle, BundleQuantity, CreatedAt)
VALUES
('Dummy Product 1', 'dummy-product-1', 'Description for Dummy Product 1', 'Short desc 1', 'DUMMY-001', 'https://via.placeholder.com/300', 100, 1, 0, 1, 1, @CategoryId, 1, 0, 1, @Now),
('Dummy Product 2', 'dummy-product-2', 'Description for Dummy Product 2', 'Short desc 2', 'DUMMY-002', 'https://via.placeholder.com/300', 50, 1, 0, 1, 0, @CategoryId, 2, 0, 1, @Now),
('Dummy Product 3', 'dummy-product-3', 'Description for Dummy Product 3', 'Short desc 3', 'DUMMY-003', 'https://via.placeholder.com/300', 200, 1, 0, 0, 1, @CategoryId, 3, 0, 1, @Now),
('Dummy Product 4', 'dummy-product-4', 'Description for Dummy Product 4', 'Short desc 4', 'DUMMY-004', 'https://via.placeholder.com/300', 0, 1, 0, 0, 0, @CategoryId, 4, 0, 1, @Now),
('Dummy Product 5', 'dummy-product-5', 'Description for Dummy Product 5', 'Short desc 5', 'DUMMY-005', 'https://via.placeholder.com/300', 10, 1, 0, 1, 1, @CategoryId, 5, 0, 1, @Now);

DECLARE @P1 INT = (SELECT Id FROM [dbo].[Products] WHERE Sku = 'DUMMY-001');
DECLARE @P2 INT = (SELECT Id FROM [dbo].[Products] WHERE Sku = 'DUMMY-002');
DECLARE @P3 INT = (SELECT Id FROM [dbo].[Products] WHERE Sku = 'DUMMY-003');
DECLARE @P4 INT = (SELECT Id FROM [dbo].[Products] WHERE Sku = 'DUMMY-004');
DECLARE @P5 INT = (SELECT Id FROM [dbo].[Products] WHERE Sku = 'DUMMY-005');

INSERT INTO [dbo].[ProductVariants] (ProductId, Sku, Size, Price, CompareAtPrice, PurchaseRate, StockQuantity, IsActive, CreatedAt)
VALUES
(@P1, 'DUMMY-001-M', 'M', 19.99, 24.99, 10.00, 100, 1, @Now),
(@P2, 'DUMMY-002-L', 'L', 29.99, 39.99, 15.00, 50, 1, @Now),
(@P3, 'DUMMY-003-S', 'S', 9.99, NULL, 5.00, 200, 1, @Now),
(@P4, 'DUMMY-004-XL', 'XL', 49.99, 59.99, 25.00, 0, 1, @Now),
(@P5, 'DUMMY-005-XXL', 'XXL', 99.99, 129.99, 50.00, 10, 1, @Now);

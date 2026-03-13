-- Create history table in dbo schema if it doesn't exist
IF OBJECT_ID(N'[dbo].[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [dbo].[__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;

-- Sync the 'init' migration
IF NOT EXISTS(SELECT * FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = '20260310062716_init')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20260310062716_init', '8.0.12');
END;

-- Sync the 'OptimizationIndices' migration
-- Note: This is necessary because this migration also contains table creation logic.
IF NOT EXISTS(SELECT * FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = '20260312150737_OptimizationIndices')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20260312150737_OptimizationIndices', '8.0.12');
END;


using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class final : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderLog_Orders_OrderId",
                schema: "dbo",
                table: "OrderLog");

            migrationBuilder.DropIndex(
                name: "IX_ProductImages_ProductId",
                schema: "dbo",
                table: "ProductImages");

            migrationBuilder.DropIndex(
                name: "IX_Collections_Slug",
                schema: "dbo",
                table: "Collections");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderLog",
                schema: "dbo",
                table: "OrderLog");

            migrationBuilder.DropColumn(
                name: "RefreshToken",
                schema: "dbo",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "RefreshTokenExpiry",
                schema: "dbo",
                table: "AspNetUsers");

            migrationBuilder.RenameTable(
                name: "OrderLog",
                schema: "dbo",
                newName: "OrderLogs",
                newSchema: "dbo");

            migrationBuilder.RenameIndex(
                name: "IX_OrderLog_OrderId",
                schema: "dbo",
                table: "OrderLogs",
                newName: "IX_OrderLogs_OrderId");

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                schema: "dbo",
                table: "Pages",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "CustomerPhone",
                schema: "dbo",
                table: "Orders",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                schema: "dbo",
                table: "OrderItems",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsMarqueeVisible",
                schema: "dbo",
                table: "CustomLandingPageConfigs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MarqueeText",
                schema: "dbo",
                table: "CustomLandingPageConfigs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                schema: "dbo",
                table: "Customers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                schema: "dbo",
                table: "Carts",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderLogs",
                schema: "dbo",
                table: "OrderLogs",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_SubCategories_DisplayOrder",
                schema: "dbo",
                table: "SubCategories",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_IsApproved",
                schema: "dbo",
                table: "Reviews",
                column: "IsApproved");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_Rating",
                schema: "dbo",
                table: "Reviews",
                column: "Rating");

            migrationBuilder.CreateIndex(
                name: "IX_ProductImages_ProductId_IsMain",
                schema: "dbo",
                table: "ProductImages",
                columns: new[] { "ProductId", "IsMain" },
                unique: true,
                filter: "[IsMain] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Pages_IsActive",
                schema: "dbo",
                table: "Pages",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Pages_Slug",
                schema: "dbo",
                table: "Pages",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CustomerPhone",
                schema: "dbo",
                table: "Orders",
                column: "CustomerPhone");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_IsPreOrder",
                schema: "dbo",
                table: "Orders",
                column: "IsPreOrder");

            migrationBuilder.CreateIndex(
                name: "IX_HeroBanners_DisplayOrder",
                schema: "dbo",
                table: "HeroBanners",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_DailyTraffics_Date",
                schema: "dbo",
                table: "DailyTraffics",
                column: "Date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Collections_DisplayOrder",
                schema: "dbo",
                table: "Collections",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Collections_Slug",
                schema: "dbo",
                table: "Collections",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_DisplayOrder",
                schema: "dbo",
                table: "Categories",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Carts_UserId",
                schema: "dbo",
                table: "Carts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BlockedIps_IpAddress",
                schema: "dbo",
                table: "BlockedIps",
                column: "IpAddress",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Carts_AspNetUsers_UserId",
                schema: "dbo",
                table: "Carts",
                column: "UserId",
                principalSchema: "dbo",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Products_ProductId",
                schema: "dbo",
                table: "OrderItems",
                column: "ProductId",
                principalSchema: "dbo",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderLogs_Orders_OrderId",
                schema: "dbo",
                table: "OrderLogs",
                column: "OrderId",
                principalSchema: "dbo",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Carts_AspNetUsers_UserId",
                schema: "dbo",
                table: "Carts");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Products_ProductId",
                schema: "dbo",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderLogs_Orders_OrderId",
                schema: "dbo",
                table: "OrderLogs");

            migrationBuilder.DropIndex(
                name: "IX_SubCategories_DisplayOrder",
                schema: "dbo",
                table: "SubCategories");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_IsApproved",
                schema: "dbo",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_Rating",
                schema: "dbo",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_ProductImages_ProductId_IsMain",
                schema: "dbo",
                table: "ProductImages");

            migrationBuilder.DropIndex(
                name: "IX_Pages_IsActive",
                schema: "dbo",
                table: "Pages");

            migrationBuilder.DropIndex(
                name: "IX_Pages_Slug",
                schema: "dbo",
                table: "Pages");

            migrationBuilder.DropIndex(
                name: "IX_Orders_CustomerPhone",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_IsPreOrder",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_HeroBanners_DisplayOrder",
                schema: "dbo",
                table: "HeroBanners");

            migrationBuilder.DropIndex(
                name: "IX_DailyTraffics_Date",
                schema: "dbo",
                table: "DailyTraffics");

            migrationBuilder.DropIndex(
                name: "IX_Collections_DisplayOrder",
                schema: "dbo",
                table: "Collections");

            migrationBuilder.DropIndex(
                name: "IX_Collections_Slug",
                schema: "dbo",
                table: "Collections");

            migrationBuilder.DropIndex(
                name: "IX_Categories_DisplayOrder",
                schema: "dbo",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Carts_UserId",
                schema: "dbo",
                table: "Carts");

            migrationBuilder.DropIndex(
                name: "IX_BlockedIps_IpAddress",
                schema: "dbo",
                table: "BlockedIps");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderLogs",
                schema: "dbo",
                table: "OrderLogs");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                schema: "dbo",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "IsMarqueeVisible",
                schema: "dbo",
                table: "CustomLandingPageConfigs");

            migrationBuilder.DropColumn(
                name: "MarqueeText",
                schema: "dbo",
                table: "CustomLandingPageConfigs");

            migrationBuilder.DropColumn(
                name: "UserId",
                schema: "dbo",
                table: "Customers");

            migrationBuilder.RenameTable(
                name: "OrderLogs",
                schema: "dbo",
                newName: "OrderLog",
                newSchema: "dbo");

            migrationBuilder.RenameIndex(
                name: "IX_OrderLogs_OrderId",
                schema: "dbo",
                table: "OrderLog",
                newName: "IX_OrderLog_OrderId");

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                schema: "dbo",
                table: "Pages",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "CustomerPhone",
                schema: "dbo",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                schema: "dbo",
                table: "Carts",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefreshToken",
                schema: "dbo",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefreshTokenExpiry",
                schema: "dbo",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderLog",
                schema: "dbo",
                table: "OrderLog",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_ProductImages_ProductId",
                schema: "dbo",
                table: "ProductImages",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Collections_Slug",
                schema: "dbo",
                table: "Collections",
                column: "Slug");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderLog_Orders_OrderId",
                schema: "dbo",
                table: "OrderLog",
                column: "OrderId",
                principalSchema: "dbo",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

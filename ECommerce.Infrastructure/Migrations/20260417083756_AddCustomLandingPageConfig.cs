using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomLandingPageConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SocialMediaSourceId",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SourcePageId",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CustomLandingPageConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    TimerEndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsTimerVisible = table.Column<bool>(type: "bit", nullable: false),
                    HeaderTitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BannerTitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BannerSubtitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsProductDetailsVisible = table.Column<bool>(type: "bit", nullable: false),
                    ProductDetailsTitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FabricDetails = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DesignDetails = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsFabricVisible = table.Column<bool>(type: "bit", nullable: false),
                    IsDesignVisible = table.Column<bool>(type: "bit", nullable: false),
                    IsTrustBannerVisible = table.Column<bool>(type: "bit", nullable: false),
                    TrustBannerText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FeaturedProductName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PromoPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    OriginalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomLandingPageConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomLandingPageConfigs_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SocialMediaSources",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialMediaSources", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SourcePages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SourcePages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_SocialMediaSourceId",
                table: "Orders",
                column: "SocialMediaSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_SourcePageId",
                table: "Orders",
                column: "SourcePageId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomLandingPageConfigs_ProductId",
                table: "CustomLandingPageConfigs",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_SocialMediaSources_SocialMediaSourceId",
                table: "Orders",
                column: "SocialMediaSourceId",
                principalTable: "SocialMediaSources",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_SourcePages_SourcePageId",
                table: "Orders",
                column: "SourcePageId",
                principalTable: "SourcePages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_SocialMediaSources_SocialMediaSourceId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_SourcePages_SourcePageId",
                table: "Orders");

            migrationBuilder.DropTable(
                name: "CustomLandingPageConfigs");

            migrationBuilder.DropTable(
                name: "SocialMediaSources");

            migrationBuilder.DropTable(
                name: "SourcePages");

            migrationBuilder.DropIndex(
                name: "IX_Orders_SocialMediaSourceId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_SourcePageId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SocialMediaSourceId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SourcePageId",
                table: "Orders");
        }
    }
}

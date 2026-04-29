using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClpFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_Sku",
                schema: "dbo",
                table: "Products");

            migrationBuilder.AlterColumn<string>(
                name: "Sku",
                schema: "dbo",
                table: "Products",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<bool>(
                name: "IsFeaturedOrderVisible",
                schema: "dbo",
                table: "CustomLandingPageConfigs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TrustBannerDescription",
                schema: "dbo",
                table: "CustomLandingPageConfigs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_Sku",
                schema: "dbo",
                table: "Products",
                column: "Sku",
                unique: true,
                filter: "[Sku] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_Sku",
                schema: "dbo",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsFeaturedOrderVisible",
                schema: "dbo",
                table: "CustomLandingPageConfigs");

            migrationBuilder.DropColumn(
                name: "TrustBannerDescription",
                schema: "dbo",
                table: "CustomLandingPageConfigs");

            migrationBuilder.AlterColumn<string>(
                name: "Sku",
                schema: "dbo",
                table: "Products",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_Sku",
                schema: "dbo",
                table: "Products",
                column: "Sku",
                unique: true);
        }
    }
}

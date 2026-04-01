using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeparationOfAdultAndNormalProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsItemProduct",
                table: "Products");

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "AdultProducts",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<decimal>(
                name: "CompareAtPrice",
                table: "AdultProducts",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "AdultProducts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "AdultProducts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_AdultProducts_Slug",
                table: "AdultProducts",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AdultProducts_Slug",
                table: "AdultProducts");

            migrationBuilder.DropColumn(
                name: "CompareAtPrice",
                table: "AdultProducts");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "AdultProducts");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "AdultProducts");

            migrationBuilder.AddColumn<bool>(
                name: "IsItemProduct",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "AdultProducts",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}

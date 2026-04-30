using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFreeShippingThresholdToCLP : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FreeShippingThresholdQuantity",
                schema: "dbo",
                table: "CustomLandingPageConfigs",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FreeShippingThresholdQuantity",
                schema: "dbo",
                table: "CustomLandingPageConfigs");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveClpFabricDesignDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DesignDetails",
                table: "CustomLandingPageConfigs");

            migrationBuilder.DropColumn(
                name: "FabricDetails",
                table: "CustomLandingPageConfigs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DesignDetails",
                table: "CustomLandingPageConfigs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FabricDetails",
                table: "CustomLandingPageConfigs",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}

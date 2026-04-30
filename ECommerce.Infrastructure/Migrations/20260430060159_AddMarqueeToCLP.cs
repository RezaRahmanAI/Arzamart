using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMarqueeToCLP : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsMarqueeVisible",
                schema: "dbo",
                table: "CustomLandingPageConfigs");

            migrationBuilder.DropColumn(
                name: "MarqueeText",
                schema: "dbo",
                table: "CustomLandingPageConfigs");
        }
    }
}

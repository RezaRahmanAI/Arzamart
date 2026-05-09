using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSectionsJsonToLandingPageConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsMarqueeVisible",
                schema: "dbo",
                table: "CustomLandingPageConfigs");

            migrationBuilder.RenameColumn(
                name: "MarqueeText",
                schema: "dbo",
                table: "CustomLandingPageConfigs",
                newName: "SectionsJson");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SectionsJson",
                schema: "dbo",
                table: "CustomLandingPageConfigs",
                newName: "MarqueeText");

            migrationBuilder.AddColumn<bool>(
                name: "IsMarqueeVisible",
                schema: "dbo",
                table: "CustomLandingPageConfigs",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}

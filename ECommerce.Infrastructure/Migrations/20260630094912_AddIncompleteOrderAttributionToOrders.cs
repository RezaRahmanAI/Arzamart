using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIncompleteOrderAttributionToOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Browser",
                schema: "dbo",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeviceType",
                schema: "dbo",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Fbclid",
                schema: "dbo",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferrerUrl",
                schema: "dbo",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SessionId",
                schema: "dbo",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UtmAd",
                schema: "dbo",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UtmAdset",
                schema: "dbo",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UtmCampaign",
                schema: "dbo",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UtmSource",
                schema: "dbo",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Browser",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DeviceType",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Fbclid",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ReferrerUrl",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SessionId",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "UtmAd",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "UtmAdset",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "UtmCampaign",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "UtmSource",
                schema: "dbo",
                table: "Orders");
        }
    }
}

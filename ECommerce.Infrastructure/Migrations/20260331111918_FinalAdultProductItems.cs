using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FinalAdultProductItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdultProducts",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Headline = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Subtitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImgUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BenefitsTitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BenefitsContent = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SideEffectsTitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SideEffectsContent = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UsageTitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UsageContent = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdultProducts", x => x.Id);
                });

            migrationBuilder.AddColumn<bool>(
                name: "IsItemProduct",
                schema: "dbo",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdultProducts",
                schema: "dbo");

            migrationBuilder.DropColumn(
                name: "IsItemProduct",
                schema: "dbo",
                table: "Products");
        }
    }
}

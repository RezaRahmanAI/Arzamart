using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FinalizeDynamicCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MetaTitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MetaDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categories_Categories_ParentId",
                        column: x => x.ParentId,
                        principalSchema: "dbo",
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_ParentId",
                schema: "dbo",
                table: "Categories",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Slug",
                schema: "dbo",
                table: "Categories",
                column: "Slug",
                unique: true);

            // Seed initial categories with specific IDs to maintain relationships
            migrationBuilder.Sql("SET IDENTITY_INSERT dbo.Categories ON;");
            migrationBuilder.Sql("INSERT INTO dbo.Categories (Id, Name, Slug, DisplayOrder, IsActive, CreatedAt) VALUES (1, 'Men', 'men', 1, 1, GETUTCDATE());");
            migrationBuilder.Sql("INSERT INTO dbo.Categories (Id, Name, Slug, DisplayOrder, IsActive, CreatedAt) VALUES (2, 'Women', 'women', 2, 1, GETUTCDATE());");
            migrationBuilder.Sql("INSERT INTO dbo.Categories (Id, Name, Slug, DisplayOrder, IsActive, CreatedAt) VALUES (3, 'Kids', 'kids', 3, 1, GETUTCDATE());");
            migrationBuilder.Sql("INSERT INTO dbo.Categories (Id, Name, Slug, DisplayOrder, IsActive, CreatedAt) VALUES (4, 'Accessories', 'accessories', 4, 1, GETUTCDATE());");
            migrationBuilder.Sql("SET IDENTITY_INSERT dbo.Categories OFF;");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Categories_CategoryId",
                schema: "dbo",
                table: "Products",
                column: "CategoryId",
                principalSchema: "dbo",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SubCategories_Categories_CategoryId",
                schema: "dbo",
                table: "SubCategories",
                column: "CategoryId",
                principalSchema: "dbo",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Categories_CategoryId",
                schema: "dbo",
                table: "Products");

            migrationBuilder.DropForeignKey(
                name: "FK_SubCategories_Categories_CategoryId",
                schema: "dbo",
                table: "SubCategories");

            migrationBuilder.DropTable(
                name: "Categories",
                schema: "dbo");
        }
    }
}

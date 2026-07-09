using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeliveryZoneId",
                schema: "dbo",
                table: "DeliveryMethods",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DeliveryZones",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryZones", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Divisions",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NameEn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NameBn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BdGovtCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Divisions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Districts",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NameEn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NameBn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BdGovtCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DivisionId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Districts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Districts_Divisions_DivisionId",
                        column: x => x.DivisionId,
                        principalSchema: "dbo",
                        principalTable: "Divisions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Upazilas",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NameEn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NameBn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BdGovtCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DistrictId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Upazilas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Upazilas_Districts_DistrictId",
                        column: x => x.DistrictId,
                        principalSchema: "dbo",
                        principalTable: "Districts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryZoneUpazilas",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeliveryZoneId = table.Column<int>(type: "int", nullable: false),
                    UpazilaId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryZoneUpazilas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryZoneUpazilas_DeliveryZones_DeliveryZoneId",
                        column: x => x.DeliveryZoneId,
                        principalSchema: "dbo",
                        principalTable: "DeliveryZones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeliveryZoneUpazilas_Upazilas_UpazilaId",
                        column: x => x.UpazilaId,
                        principalSchema: "dbo",
                        principalTable: "Upazilas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryMethods_DeliveryZoneId",
                schema: "dbo",
                table: "DeliveryMethods",
                column: "DeliveryZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryZones_Name",
                schema: "dbo",
                table: "DeliveryZones",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryZoneUpazilas_DeliveryZoneId_UpazilaId",
                schema: "dbo",
                table: "DeliveryZoneUpazilas",
                columns: new[] { "DeliveryZoneId", "UpazilaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryZoneUpazilas_UpazilaId",
                schema: "dbo",
                table: "DeliveryZoneUpazilas",
                column: "UpazilaId");

            migrationBuilder.CreateIndex(
                name: "IX_Districts_DisplayOrder",
                schema: "dbo",
                table: "Districts",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Districts_DivisionId",
                schema: "dbo",
                table: "Districts",
                column: "DivisionId");

            migrationBuilder.CreateIndex(
                name: "IX_Districts_NameEn",
                schema: "dbo",
                table: "Districts",
                column: "NameEn",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Divisions_DisplayOrder",
                schema: "dbo",
                table: "Divisions",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Divisions_NameEn",
                schema: "dbo",
                table: "Divisions",
                column: "NameEn",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Upazilas_DisplayOrder",
                schema: "dbo",
                table: "Upazilas",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Upazilas_DistrictId",
                schema: "dbo",
                table: "Upazilas",
                column: "DistrictId");

            migrationBuilder.CreateIndex(
                name: "IX_Upazilas_NameEn",
                schema: "dbo",
                table: "Upazilas",
                column: "NameEn");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryMethods_DeliveryZones_DeliveryZoneId",
                schema: "dbo",
                table: "DeliveryMethods",
                column: "DeliveryZoneId",
                principalSchema: "dbo",
                principalTable: "DeliveryZones",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryMethods_DeliveryZones_DeliveryZoneId",
                schema: "dbo",
                table: "DeliveryMethods");

            migrationBuilder.DropTable(
                name: "DeliveryZoneUpazilas",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "DeliveryZones",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "Upazilas",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "Districts",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "Divisions",
                schema: "dbo");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryMethods_DeliveryZoneId",
                schema: "dbo",
                table: "DeliveryMethods");

            migrationBuilder.DropColumn(
                name: "DeliveryZoneId",
                schema: "dbo",
                table: "DeliveryMethods");
        }
    }
}

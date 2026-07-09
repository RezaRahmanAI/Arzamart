using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixOrderLocationColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DistrictId",
                schema: "dbo",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DivisionId",
                schema: "dbo",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DistrictId",
                schema: "dbo",
                table: "Customers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DivisionId",
                schema: "dbo",
                table: "Customers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpazilaId",
                schema: "dbo",
                table: "Customers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_DistrictId",
                schema: "dbo",
                table: "Orders",
                column: "DistrictId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_DivisionId",
                schema: "dbo",
                table: "Orders",
                column: "DivisionId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_DistrictId",
                schema: "dbo",
                table: "Customers",
                column: "DistrictId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_DivisionId",
                schema: "dbo",
                table: "Customers",
                column: "DivisionId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_UpazilaId",
                schema: "dbo",
                table: "Customers",
                column: "UpazilaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Districts_DistrictId",
                schema: "dbo",
                table: "Customers",
                column: "DistrictId",
                principalSchema: "dbo",
                principalTable: "Districts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Divisions_DivisionId",
                schema: "dbo",
                table: "Customers",
                column: "DivisionId",
                principalSchema: "dbo",
                principalTable: "Divisions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Upazilas_UpazilaId",
                schema: "dbo",
                table: "Customers",
                column: "UpazilaId",
                principalSchema: "dbo",
                principalTable: "Upazilas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Districts_DistrictId",
                schema: "dbo",
                table: "Orders",
                column: "DistrictId",
                principalSchema: "dbo",
                principalTable: "Districts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Divisions_DivisionId",
                schema: "dbo",
                table: "Orders",
                column: "DivisionId",
                principalSchema: "dbo",
                principalTable: "Divisions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Districts_DistrictId",
                schema: "dbo",
                table: "Customers");

            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Divisions_DivisionId",
                schema: "dbo",
                table: "Customers");

            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Upazilas_UpazilaId",
                schema: "dbo",
                table: "Customers");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Districts_DistrictId",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Divisions_DivisionId",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_DistrictId",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_DivisionId",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Customers_DistrictId",
                schema: "dbo",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_DivisionId",
                schema: "dbo",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_UpazilaId",
                schema: "dbo",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "DistrictId",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DivisionId",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DistrictId",
                schema: "dbo",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "DivisionId",
                schema: "dbo",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "UpazilaId",
                schema: "dbo",
                table: "Customers");
        }
    }
}

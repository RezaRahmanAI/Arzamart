using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderUpazilaId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UpazilaId",
                schema: "dbo",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UpazilaId",
                schema: "dbo",
                table: "Orders",
                column: "UpazilaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Upazilas_UpazilaId",
                schema: "dbo",
                table: "Orders",
                column: "UpazilaId",
                principalSchema: "dbo",
                principalTable: "Upazilas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Upazilas_UpazilaId",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_UpazilaId",
                schema: "dbo",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "UpazilaId",
                schema: "dbo",
                table: "Orders");
        }
    }
}

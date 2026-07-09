using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LinkDeliveryMethodsToZones : Migration
    {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            UPDATE dm
            SET dm.DeliveryZoneId = dz.Id
            FROM DeliveryMethods dm
            INNER JOIN DeliveryZones dz ON dz.Name = 'Inside Dhaka'
            WHERE dm.Name = 'Inside Dhaka'
        ");

        migrationBuilder.Sql(@"
            UPDATE dm
            SET dm.DeliveryZoneId = dz.Id
            FROM DeliveryMethods dm
            INNER JOIN DeliveryZones dz ON dz.Name = 'Outside Dhaka'
            WHERE dm.Name IN ('Outside Dhaka', 'Dhaka Sub aria')
        ");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("UPDATE DeliveryMethods SET DeliveryZoneId = NULL WHERE DeliveryZoneId IS NOT NULL");
    }
    }
}

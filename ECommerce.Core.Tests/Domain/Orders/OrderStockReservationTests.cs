using ECommerce.Core.Domain.Orders;
using Xunit;

namespace ECommerce.Core.Tests.Domain.Orders;

public class OrderStockReservationTests
{
    [Fact]
    public void Create_ValidInput_SuccessfullyCreatesReservation()
    {
        var reservation = OrderStockReservation.Create(
            orderId: 1,
            orderItemId: 10,
            productId: 5,
            reservedQuantity: 3,
            variantSize: "L"
        );

        Assert.NotNull(reservation);
        Assert.Equal(1, reservation.OrderId);
        Assert.Equal(10, reservation.OrderItemId);
        Assert.Equal(5, reservation.ProductId);
        Assert.Equal(3, reservation.ReservedQuantity);
        Assert.Equal("L", reservation.VariantSize);
        Assert.Equal(ReservationStatus.Reserved, reservation.Status);
    }

    [Fact]
    public void Create_WithoutVariantSize_SuccessfullyCreatesReservation()
    {
        var reservation = OrderStockReservation.Create(
            orderId: 1,
            orderItemId: 10,
            productId: 5,
            reservedQuantity: 2
        );

        Assert.NotNull(reservation);
        Assert.Null(reservation.VariantSize);
    }

    [Fact]
    public void Create_InvalidOrderId_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderItemException>(() =>
            OrderStockReservation.Create(orderId: 0, orderItemId: 1, productId: 1, reservedQuantity: 1)
        );

        Assert.NotNull(ex);
        Assert.Contains("Order ID", ex.Message);
    }

    [Fact]
    public void Create_InvalidOrderItemId_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderItemException>(() =>
            OrderStockReservation.Create(orderId: 1, orderItemId: 0, productId: 1, reservedQuantity: 1)
        );

        Assert.NotNull(ex);
        Assert.Contains("Order item ID", ex.Message);
    }

    [Fact]
    public void Create_InvalidProductId_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderItemException>(() =>
            OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 0, reservedQuantity: 1)
        );

        Assert.NotNull(ex);
        Assert.Contains("Product ID", ex.Message);
    }

    [Fact]
    public void Create_ZeroQuantity_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderItemException>(() =>
            OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 0)
        );

        Assert.NotNull(ex);
        Assert.Contains("quantity", ex.Message, System.StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Create_NegativeQuantity_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderItemException>(() =>
            OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: -5)
        );

        Assert.NotNull(ex);
        Assert.Contains("quantity", ex.Message, System.StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Consume_ValidState_UpdatesStatusAndSetsConsumerAt()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        var beforeConsume = DateTime.UtcNow;
        
        reservation.Consume();

        var afterConsume = DateTime.UtcNow;
        Assert.Equal(ReservationStatus.Consumed, reservation.Status);
        Assert.NotNull(reservation.ConsumedAt);
        Assert.True(reservation.ConsumedAt >= beforeConsume);
        Assert.True(reservation.ConsumedAt <= afterConsume);
    }

    [Fact]
    public void Consume_AlreadyConsumed_ThrowsInvalidOrderItemException()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        reservation.Consume();

        var ex = Assert.Throws<InvalidOrderItemException>(() => reservation.Consume());
        Assert.NotNull(ex);
    }

    [Fact]
    public void Consume_AlreadyReleased_ThrowsInvalidOrderItemException()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        reservation.Release("Testing");

        var ex = Assert.Throws<InvalidOrderItemException>(() => reservation.Consume());
        Assert.NotNull(ex);
    }

    [Fact]
    public void Release_FromReservedStatus_UpdatesStatusAndSetsReleasedAt()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        var beforeRelease = DateTime.UtcNow;

        reservation.Release("Order cancelled");

        var afterRelease = DateTime.UtcNow;
        Assert.Equal(ReservationStatus.Released, reservation.Status);
        Assert.NotNull(reservation.ReleasedAt);
        Assert.True(reservation.ReleasedAt >= beforeRelease);
        Assert.True(reservation.ReleasedAt <= afterRelease);
        Assert.Equal("Order cancelled", reservation.ReleaseReason);
    }

    [Fact]
    public void Release_FromConsumedStatus_WithReason_UpdatesStatus()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        reservation.Consume();

        reservation.Release("Customer return");

        Assert.Equal(ReservationStatus.Released, reservation.Status);
        Assert.Equal("Customer return", reservation.ReleaseReason);
    }

    [Fact]
    public void Release_FromConsumedStatus_WithoutReason_ThrowsInvalidOrderItemException()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        reservation.Consume();

        var ex = Assert.Throws<InvalidOrderItemException>(() => reservation.Release());
        Assert.NotNull(ex);
        Assert.Contains("reason", ex.Message, System.StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Release_AlreadyReleased_ThrowsInvalidOrderItemException()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        reservation.Release("First release");

        var ex = Assert.Throws<InvalidOrderItemException>(() => reservation.Release("Second release"));
        Assert.NotNull(ex);
    }

    [Fact]
    public void CanBeReleased_ReservedStatus_ReturnsTrue()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        Assert.True(reservation.CanBeReleased);
    }

    [Fact]
    public void CanBeReleased_ConsumedStatus_ReturnsTrue()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        reservation.Consume();
        
        Assert.True(reservation.CanBeReleased);
    }

    [Fact]
    public void CanBeReleased_ReleasedStatus_ReturnsFalse()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        reservation.Release("Test");

        Assert.False(reservation.CanBeReleased);
    }

    [Fact]
    public void IsConsumed_ReservedStatus_ReturnsFalse()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        Assert.False(reservation.IsConsumed);
    }

    [Fact]
    public void IsConsumed_ConsumedStatus_ReturnsTrue()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        reservation.Consume();

        Assert.True(reservation.IsConsumed);
    }

    [Fact]
    public void IsConsumed_ReleasedStatus_ReturnsFalse()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        reservation.Release("Test");

        Assert.False(reservation.IsConsumed);
    }

    [Fact]
    public void DaysReserved_NewReservation_ReturnsZero()
    {
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        Assert.Equal(0, reservation.DaysReserved);
    }

    [Fact]
    public void ReservedAt_IsSetAutomatically()
    {
        var beforeCreation = DateTime.UtcNow;
        var reservation = OrderStockReservation.Create(orderId: 1, orderItemId: 1, productId: 1, reservedQuantity: 2);
        var afterCreation = DateTime.UtcNow;

        Assert.True(reservation.ReservedAt >= beforeCreation);
        Assert.True(reservation.ReservedAt <= afterCreation);
    }
}

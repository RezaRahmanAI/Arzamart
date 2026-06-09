using ECommerce.Core.Domain.Orders;
using Xunit;

namespace ECommerce.Core.Tests.Domain.Orders;

public class OrderStatusTransitionTests
{
    private readonly Order _testOrder;

    public OrderStatusTransitionTests()
    {
        var items = new[]
        {
            OrderItem.Create(productId: 1, productName: "Product 1", quantity: 1, unitPrice: 100m)
        };

        _testOrder = Order.Create(
            orderNumber: "ORD-TEST-001",
            customerName: "Test User",
            customerPhone: "1234567890",
            shippingAddress: "Test St",
            city: "Test City",
            area: "Test Area",
            items: items,
            subTotal: 100m,
            tax: 0m,
            shippingCost: 50m,
            discount: 0m
        );
    }

    [Fact]
    public void Confirm_FromPending_TransitionsSuccessfully()
    {
        _testOrder.Confirm("Admin");
        Assert.Equal(OrderStatus.Confirmed, _testOrder.Status);
    }

    [Fact]
    public void MarkAsProcessing_FromConfirmed_TransitionsSuccessfully()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");
        
        Assert.Equal(OrderStatus.Processing, _testOrder.Status);
    }

    [Fact]
    public void MarkAsPacked_FromProcessing_TransitionsSuccessfully()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");
        _testOrder.MarkAsPacked("Admin");
        
        Assert.Equal(OrderStatus.Packed, _testOrder.Status);
    }

    [Fact]
    public void MarkAsShipped_FromPacked_TransitionsSuccessfully()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");
        _testOrder.MarkAsPacked("Admin");
        _testOrder.MarkAsShipped("Admin");
        
        Assert.Equal(OrderStatus.Shipped, _testOrder.Status);
    }

    [Fact]
    public void MarkAsDelivered_FromShipped_TransitionsSuccessfully()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");
        _testOrder.MarkAsPacked("Admin");
        _testOrder.MarkAsShipped("Admin");
        _testOrder.MarkAsDelivered("Admin");
        
        Assert.Equal(OrderStatus.Delivered, _testOrder.Status);
    }

    [Fact]
    public void Cancel_FromPending_TransitionsSuccessfully()
    {
        _testOrder.Cancel("Customer requested");
        Assert.Equal(OrderStatus.Cancelled, _testOrder.Status);
    }

    [Fact]
    public void Cancel_FromConfirmed_TransitionsSuccessfully()
    {
        _testOrder.Confirm("Admin");
        _testOrder.Cancel("Customer requested");
        Assert.Equal(OrderStatus.Cancelled, _testOrder.Status);
    }

    [Fact]
    public void PutOnHold_FromPending_TransitionsSuccessfully()
    {
        _testOrder.PutOnHold("Out of stock");
        Assert.Equal(OrderStatus.Hold, _testOrder.Status);
    }

    [Fact]
    public void TransitionFromHold_ToConfirmed_TransitionsSuccessfully()
    {
        _testOrder.PutOnHold("Testing");
        _testOrder.TransitionStatus(OrderStatus.Confirmed, "Admin", "Release from hold");
        
        Assert.Equal(OrderStatus.Confirmed, _testOrder.Status);
    }

    [Fact]
    public void InitiateReturn_FromDelivered_TransitionsSuccessfully()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");
        _testOrder.MarkAsPacked("Admin");
        _testOrder.MarkAsShipped("Admin");
        _testOrder.MarkAsDelivered("Admin");
        _testOrder.InitiateReturn("Defective product");
        
        Assert.Equal(OrderStatus.Return, _testOrder.Status);
    }

    [Fact]
    public void TransitionStatus_InvalidTransition_ThrowsInvalidOrderStatusTransitionException()
    {
        _testOrder.Confirm("Admin");

        var ex = Assert.Throws<InvalidOrderStatusTransitionException>(() =>
            _testOrder.TransitionStatus(OrderStatus.Pending, "Admin", "Test")
        );

        Assert.NotNull(ex);
        Assert.Contains("Cannot", ex.Message);
    }

    [Fact]
    public void Cancel_FromDelivered_ThrowsException()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");
        _testOrder.MarkAsPacked("Admin");
        _testOrder.MarkAsShipped("Admin");
        _testOrder.MarkAsDelivered("Admin");

        // Try to cancel a delivered order - not directly allowed
        // Should go through Return process instead
        var ex = Assert.Throws<InvalidOrderStatusTransitionException>(() =>
            _testOrder.Cancel("Customer changed mind")
        );

        Assert.NotNull(ex);
    }

    [Fact]
    public void StatusLogs_TracksAllTransitions()
    {
        _testOrder.Confirm("Admin1");
        _testOrder.MarkAsProcessing("Admin2");
        
        Assert.True(_testOrder.StatusLogs.Count >= 2);
    }

    [Fact]
    public void StatusLog_ContainsCorrectInfo()
    {
        _testOrder.Confirm("Admin");
        var lastLog = _testOrder.StatusLogs.Last();

        Assert.Equal(OrderStatus.Confirmed, lastLog.NewStatus);
        Assert.Equal(OrderStatus.Pending, lastLog.PreviousStatus);
        Assert.Equal("Admin", lastLog.ChangedBy);
    }

    [Fact]
    public void TransitionStatus_WithReason_LogsReason()
    {
        _testOrder.TransitionStatus(OrderStatus.Confirmed, "Admin", "User confirmed order");
        var lastLog = _testOrder.StatusLogs.Last();

        Assert.Equal("User confirmed order", lastLog.Reason);
    }

    [Fact]
    public void UpdatedAt_ChangesOnStatusTransition()
    {
        var originalUpdatedAt = DateTime.UtcNow;
        System.Threading.Thread.Sleep(10);
        
        _testOrder.Confirm("Admin");

        Assert.True(_testOrder.UpdatedAt > originalUpdatedAt);
    }
}

using ECommerce.Core.Domain.Orders;
using Xunit;

namespace ECommerce.Core.Tests.Domain.Orders;

public class OrderBusinessLogicTests
{
    private readonly Order _testOrder;

    public OrderBusinessLogicTests()
    {
        var items = new[]
        {
            OrderItem.Create(productId: 1, productName: "Product 1", quantity: 2, unitPrice: 100m),
            OrderItem.Create(productId: 2, productName: "Product 2", quantity: 1, unitPrice: 50m)
        };

        _testOrder = Order.Create(
            orderNumber: "ORD-BUSINESS-001",
            customerName: "Business Test User",
            customerPhone: "1234567890",
            shippingAddress: "Business St",
            city: "Business City",
            area: "Business Area",
            items: items,
            subTotal: 250m,
            tax: 25m,
            shippingCost: 50m,
            discount: 0m,
            advancePayment: 100m
        );
    }

    [Fact]
    public void RemainingAmount_WithAdvancePayment_CalculatesCorrectly()
    {
        // Total = 250 + 25 + 50 = 325
        // Remaining = 325 - 100 = 225
        Assert.Equal(225m, _testOrder.RemainingAmount);
    }

    [Fact]
    public void RemainingAmount_WithFullPayment_ReturnsZero()
    {
        var items = new[] { OrderItem.Create(1, "Product", 1, 100m) };
        var order = Order.Create("ORD-001", "User", "123", "St", "City", "Area", items, 100m, 0, 0, 0, 100m);

        Assert.Equal(0m, order.RemainingAmount);
    }

    [Fact]
    public void GetPaymentStatus_Unpaid_ReturnsUnpaid()
    {
        var items = new[] { OrderItem.Create(1, "Product", 1, 100m) };
        var order = Order.Create("ORD-001", "User", "123", "St", "City", "Area", items, 100m, 0, 0, 0);

        Assert.Equal(PaymentStatus.Unpaid, order.GetPaymentStatus());
    }

    [Fact]
    public void GetPaymentStatus_PartiallyPaid_ReturnsPartiallyPaid()
    {
        Assert.Equal(PaymentStatus.PartiallyPaid, _testOrder.GetPaymentStatus());
    }

    [Fact]
    public void GetPaymentStatus_FullyPaid_ReturnsFullyPaid()
    {
        var items = new[] { OrderItem.Create(1, "Product", 1, 100m) };
        var order = Order.Create("ORD-001", "User", "123", "St", "City", "Area", items, 100m, 0, 0, 0, 100m);

        Assert.Equal(PaymentStatus.FullyPaid, order.GetPaymentStatus());
    }

    [Fact]
    public void CanBeCancelled_PendingStatus_ReturnsTrue()
    {
        Assert.True(_testOrder.CanBeCancelled);
    }

    [Fact]
    public void CanBeCancelled_ConfirmedStatus_ReturnsTrue()
    {
        _testOrder.Confirm("Admin");
        Assert.True(_testOrder.CanBeCancelled);
    }

    [Fact]
    public void CanBeCancelled_ProcessingStatus_ReturnsFalse()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");

        Assert.False(_testOrder.CanBeCancelled);
    }

    [Fact]
    public void CanBeCancelled_ShippedStatus_ReturnsFalse()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");
        _testOrder.MarkAsPacked("Admin");
        _testOrder.MarkAsShipped("Admin");

        Assert.False(_testOrder.CanBeCancelled);
    }

    [Fact]
    public void CanBeModified_PendingStatus_ReturnsTrue()
    {
        Assert.True(_testOrder.CanBeModified);
    }

    [Fact]
    public void CanBeModified_ConfirmedStatus_ReturnsTrue()
    {
        _testOrder.Confirm("Admin");
        Assert.True(_testOrder.CanBeModified);
    }

    [Fact]
    public void CanBeModified_HoldStatus_ReturnsTrue()
    {
        _testOrder.PutOnHold("Testing");
        Assert.True(_testOrder.CanBeModified);
    }

    [Fact]
    public void CanBeModified_ProcessingStatus_ReturnsFalse()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");

        Assert.False(_testOrder.CanBeModified);
    }

    [Fact]
    public void CanBeModified_ShippedStatus_ReturnsFalse()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");
        _testOrder.MarkAsPacked("Admin");
        _testOrder.MarkAsShipped("Admin");

        Assert.False(_testOrder.CanBeModified);
    }

    [Fact]
    public void IsTerminal_PendingStatus_ReturnsFalse()
    {
        Assert.False(_testOrder.IsTerminal);
    }

    [Fact]
    public void IsTerminal_RefundStatus_ReturnsTrue()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");
        _testOrder.MarkAsPacked("Admin");
        _testOrder.MarkAsShipped("Admin");
        _testOrder.MarkAsDelivered("Admin");
        _testOrder.InitiateReturn("Return");
        _testOrder.TransitionStatus(OrderStatus.ReturnProcess, "Admin", "Processing");
        _testOrder.TransitionStatus(OrderStatus.Refund, "Admin", "Refund");

        Assert.True(_testOrder.IsTerminal);
    }

    [Fact]
    public void AddAdminNote_AddsNoteSuccessfully()
    {
        _testOrder.AddAdminNote("This is an admin note");
        
        Assert.NotNull(_testOrder.AdminNote);
        Assert.Contains("admin note", _testOrder.AdminNote);
    }

    [Fact]
    public void AddCustomerNote_AddsNoteSuccessfully()
    {
        _testOrder.AddCustomerNote("This is a customer note");
        
        Assert.NotNull(_testOrder.CustomerNote);
        Assert.Contains("customer note", _testOrder.CustomerNote);
    }

    [Fact]
    public void UpdateFinancials_UpdatesValuesSuccessfully()
    {
        _testOrder.UpdateFinancials(
            subTotal: 300m,
            tax: 30m,
            shippingCost: 60m,
            discount: 10m,
            advancePayment: 100m
        );

        Assert.Equal(300m, _testOrder.SubTotal);
        Assert.Equal(30m, _testOrder.Tax);
        Assert.Equal(60m, _testOrder.ShippingCost);
        Assert.Equal(10m, _testOrder.Discount);
    }

    [Fact]
    public void UpdateFinancials_CanOnlyBeCalledOnModifiableOrders()
    {
        _testOrder.Confirm("Admin");
        _testOrder.MarkAsProcessing("Admin");

        var ex = Assert.Throws<OrderCannotBeModifiedException>(() =>
            _testOrder.UpdateFinancials(300m, 30m, 60m, 10m, 100m)
        );

        Assert.NotNull(ex);
    }

    [Fact]
    public void Total_CalculatesCorrectly()
    {
        var items = new[] { OrderItem.Create(1, "Product", 1, 100m) };
        var order = Order.Create(
            "ORD-001", "User", "123", "St", "City", "Area",
            items,
            subTotal: 100m,
            tax: 10m,
            shippingCost: 20m,
            discount: 5m
        );

        Assert.Equal(125m, order.Total); // 100 + 10 + 20 - 5
    }

    [Fact]
    public void Items_IsReadOnly()
    {
        var items = _testOrder.Items;
        Assert.IsAssignableFrom<IReadOnlyCollection<OrderItem>>(items);
    }

    [Fact]
    public void StatusLogs_IsReadOnly()
    {
        var logs = _testOrder.StatusLogs;
        Assert.IsAssignableFrom<IReadOnlyCollection<OrderStatusLog>>(logs);
    }

    [Fact]
    public void CreatedAt_CannotBeModified()
    {
        var originalCreatedAt = _testOrder.CreatedAt;
        System.Threading.Thread.Sleep(10);
        _testOrder.Confirm("Admin");

        Assert.Equal(originalCreatedAt, _testOrder.CreatedAt);
    }

    [Fact]
    public void ConvertToPreOrder_ChangesStatus()
    {
        _testOrder.ConvertToPreOrder("Item out of stock");
        Assert.Equal(OrderStatus.PreOrder, _testOrder.Status);
    }

    [Fact]
    public void MarkAsRefunded_UpdatesStatus()
    {
        _testOrder.Cancel("User cancelled");
        _testOrder.TransitionStatus(OrderStatus.Refund, "Admin", "Refund processed");

        Assert.Equal(OrderStatus.Refund, _testOrder.Status);
    }
}

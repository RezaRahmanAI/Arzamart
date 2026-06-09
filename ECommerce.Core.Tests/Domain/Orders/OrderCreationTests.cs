using ECommerce.Core.Domain.Orders;
using Xunit;

namespace ECommerce.Core.Tests.Domain.Orders;

public class OrderCreationTests
{
    private readonly OrderItem[] _validItems;

    public OrderCreationTests()
    {
        _validItems = new[]
        {
            OrderItem.Create(productId: 1, productName: "Product 1", quantity: 2, unitPrice: 100m),
            OrderItem.Create(productId: 2, productName: "Product 2", quantity: 1, unitPrice: 50m)
        };
    }

    [Fact]
    public void Create_ValidInput_SuccessfullyCreatesOrder()
    {
        var order = Order.Create(
            orderNumber: "ORD-2024-001",
            customerName: "John Doe",
            customerPhone: "123456789",
            shippingAddress: "123 Main St",
            city: "Dhaka",
            area: "Gulshan",
            items: _validItems,
            subTotal: 250m,
            tax: 0m,
            shippingCost: 50m,
            discount: 0m
        );

        Assert.NotNull(order);
        Assert.Equal("ORD-2024-001", order.OrderNumber);
        Assert.Equal("John Doe", order.CustomerName);
        Assert.Equal("123456789", order.CustomerPhone);
        Assert.Equal("123 Main St", order.ShippingAddress);
        Assert.Equal("Dhaka", order.City);
        Assert.Equal("Gulshan", order.Area);
        Assert.Equal(250m, order.SubTotal);
        Assert.Equal(0m, order.Tax);
        Assert.Equal(50m, order.ShippingCost);
        Assert.Equal(0m, order.Discount);
        Assert.Equal(300m, order.Total);
        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Equal(2, order.Items.Count);
    }

    [Fact]
    public void Create_WithTaxAndDiscount_CalculatesTotalCorrectly()
    {
        var order = Order.Create(
            orderNumber: "ORD-2024-002",
            customerName: "Jane Doe",
            customerPhone: "987654321",
            shippingAddress: "456 Oak Ave",
            city: "Dhaka",
            area: "Dhanmondi",
            items: _validItems,
            subTotal: 250m,
            tax: 25m,
            shippingCost: 50m,
            discount: 25m
        );

        Assert.Equal(300m, order.Total); // 250 + 25 + 50 - 25
    }

    [Fact]
    public void Create_WithAdvancePayment_SetsPaid()
    {
        var order = Order.Create(
            orderNumber: "ORD-2024-003",
            customerName: "Bob Smith",
            customerPhone: "111111111",
            shippingAddress: "789 Elm St",
            city: "Dhaka",
            area: "Banani",
            items: _validItems,
            subTotal: 250m,
            tax: 0m,
            shippingCost: 50m,
            discount: 0m,
            advancePayment: 150m
        );

        Assert.Equal(150m, order.AdvancePayment);
        Assert.Equal(150m, order.RemainingAmount);
    }

    [Fact]
    public void Create_NoItems_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderItemException>(() =>
            Order.Create(
                orderNumber: "ORD-2024-004",
                customerName: "Test User",
                customerPhone: "123",
                shippingAddress: "Test St",
                city: "Test City",
                area: "Test Area",
                items: Array.Empty<OrderItem>(),
                subTotal: 0m,
                tax: 0m,
                shippingCost: 0m,
                discount: 0m
            )
        );

        Assert.NotNull(ex);
        Assert.Contains("item", ex.Message, System.StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Create_EmptyCustomerName_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderItemException>(() =>
            Order.Create(
                orderNumber: "ORD-2024-005",
                customerName: "",
                customerPhone: "123456789",
                shippingAddress: "123 St",
                city: "City",
                area: "Area",
                items: _validItems,
                subTotal: 250m,
                tax: 0m,
                shippingCost: 50m,
                discount: 0m
            )
        );

        Assert.NotNull(ex);
    }

    [Fact]
    public void Create_NegativeSubTotal_ThrowsInvalidOrderPricingException()
    {
        var ex = Assert.Throws<InvalidOrderPricingException>(() =>
            Order.Create(
                orderNumber: "ORD-2024-006",
                customerName: "John",
                customerPhone: "123",
                shippingAddress: "St",
                city: "City",
                area: "Area",
                items: _validItems,
                subTotal: -100m,
                tax: 0m,
                shippingCost: 50m,
                discount: 0m
            )
        );

        Assert.NotNull(ex);
    }

    [Fact]
    public void Create_DiscountGreaterThanSubTotal_ThrowsInvalidOrderPricingException()
    {
        var ex = Assert.Throws<InvalidOrderPricingException>(() =>
            Order.Create(
                orderNumber: "ORD-2024-007",
                customerName: "John",
                customerPhone: "123",
                shippingAddress: "St",
                city: "City",
                area: "Area",
                items: _validItems,
                subTotal: 100m,
                tax: 0m,
                shippingCost: 50m,
                discount: 150m
            )
        );

        Assert.NotNull(ex);
    }

    [Fact]
    public void Create_AdvancePaymentGreaterThanTotal_ThrowsInvalidOrderPricingException()
    {
        var ex = Assert.Throws<InvalidOrderPricingException>(() =>
            Order.Create(
                orderNumber: "ORD-2024-008",
                customerName: "John",
                customerPhone: "123",
                shippingAddress: "St",
                city: "City",
                area: "Area",
                items: _validItems,
                subTotal: 100m,
                tax: 0m,
                shippingCost: 50m,
                discount: 0m,
                advancePayment: 200m
            )
        );

        Assert.NotNull(ex);
    }

    [Fact]
    public void Create_SetsCreatedAtTimestamp()
    {
        var beforeCreation = DateTime.UtcNow;
        var order = Order.Create(
            orderNumber: "ORD-2024-009",
            customerName: "John",
            customerPhone: "123",
            shippingAddress: "St",
            city: "City",
            area: "Area",
            items: _validItems,
            subTotal: 250m,
            tax: 0m,
            shippingCost: 50m,
            discount: 0m
        );
        var afterCreation = DateTime.UtcNow;

        Assert.True(order.CreatedAt >= beforeCreation);
        Assert.True(order.CreatedAt <= afterCreation);
    }

    [Fact]
    public void Create_ItemsAreReadOnlyCollection()
    {
        var order = Order.Create(
            orderNumber: "ORD-2024-010",
            customerName: "John",
            customerPhone: "123",
            shippingAddress: "St",
            city: "City",
            area: "Area",
            items: _validItems,
            subTotal: 250m,
            tax: 0m,
            shippingCost: 50m,
            discount: 0m
        );

        // Should not be able to cast to modifiable collection
        var items = order.Items;
        Assert.IsAssignableFrom<IReadOnlyCollection<OrderItem>>(items);
    }
}

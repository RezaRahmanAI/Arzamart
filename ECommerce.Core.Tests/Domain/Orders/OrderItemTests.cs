using ECommerce.Core.Domain.Orders;
using Xunit;

namespace ECommerce.Core.Tests.Domain.Orders;

public class OrderItemTests
{
    [Fact]
    public void Create_ValidInput_SuccessfullyCreatesOrderItem()
    {
        var item = OrderItem.Create(
            productId: 1,
            productName: "Test Product",
            quantity: 2,
            unitPrice: 100m,
            size: "M",
            imageUrl: "http://example.com/image.jpg"
        );

        Assert.NotNull(item);
        Assert.Equal(1, item.ProductId);
        Assert.Equal("Test Product", item.ProductName);
        Assert.Equal(2, item.Quantity);
        Assert.Equal(100m, item.UnitPrice);
        Assert.Equal("M", item.Size);
        Assert.Equal("http://example.com/image.jpg", item.ImageUrl);
        Assert.Equal(200m, item.TotalPrice);
    }

    [Fact]
    public void Create_WithoutSize_SuccessfullyCreatesOrderItem()
    {
        var item = OrderItem.Create(
            productId: 1,
            productName: "Test Product",
            quantity: 1,
            unitPrice: 50m
        );

        Assert.NotNull(item);
        Assert.Null(item.Size);
    }

    [Fact]
    public void Create_ZeroQuantity_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderItemException>(() =>
            OrderItem.Create(productId: 1, productName: "Test", quantity: 0, unitPrice: 100m)
        );

        Assert.NotNull(ex);
        Assert.Contains("quantity", ex.Message, System.StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Create_NegativeQuantity_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderItemException>(() =>
            OrderItem.Create(productId: 1, productName: "Test", quantity: -1, unitPrice: 100m)
        );

        Assert.NotNull(ex);
        Assert.Contains("quantity", ex.Message, System.StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Create_NegativePrice_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderPricingException>(() =>
            OrderItem.Create(productId: 1, productName: "Test", quantity: 1, unitPrice: -10m)
        );

        Assert.NotNull(ex);
        Assert.Contains("price", ex.Message, System.StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Create_InvalidProductId_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderItemException>(() =>
            OrderItem.Create(productId: 0, productName: "Test", quantity: 1, unitPrice: 100m)
        );

        Assert.NotNull(ex);
        Assert.Contains("Product ID", ex.Message);
    }

    [Fact]
    public void Create_EmptyProductName_ThrowsInvalidOrderItemException()
    {
        var ex = Assert.Throws<InvalidOrderItemException>(() =>
            OrderItem.Create(productId: 1, productName: "", quantity: 1, unitPrice: 100m)
        );

        Assert.NotNull(ex);
        Assert.Contains("name", ex.Message, System.StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void UpdateQuantity_ValidQuantity_UpdatesSuccessfully()
    {
        var item = OrderItem.Create(productId: 1, productName: "Test", quantity: 2, unitPrice: 100m);
        item.UpdateQuantity(5);

        Assert.Equal(5, item.Quantity);
        Assert.Equal(500m, item.TotalPrice);
    }

    [Fact]
    public void UpdateQuantity_ZeroQuantity_ThrowsInvalidOrderItemException()
    {
        var item = OrderItem.Create(productId: 1, productName: "Test", quantity: 2, unitPrice: 100m);
        
        var ex = Assert.Throws<InvalidOrderItemException>(() => item.UpdateQuantity(0));
        Assert.NotNull(ex);
    }

    [Fact]
    public void UpdatePrice_ValidPrice_UpdatesSuccessfully()
    {
        var item = OrderItem.Create(productId: 1, productName: "Test", quantity: 2, unitPrice: 100m);
        item.UpdatePrice(150m);

        Assert.Equal(150m, item.UnitPrice);
        Assert.Equal(300m, item.TotalPrice);
    }

    [Fact]
    public void UpdatePrice_ZeroPrice_UpdatesSuccessfully()
    {
        var item = OrderItem.Create(productId: 1, productName: "Test", quantity: 2, unitPrice: 100m);
        item.UpdatePrice(0m);

        Assert.Equal(0m, item.UnitPrice);
        Assert.Equal(0m, item.TotalPrice);
    }

    [Fact]
    public void UpdatePrice_NegativePrice_ThrowsInvalidOrderItemException()
    {
        var item = OrderItem.Create(productId: 1, productName: "Test", quantity: 2, unitPrice: 100m);
        
        var ex = Assert.Throws<InvalidOrderPricingException>(() => item.UpdatePrice(-10m));
        Assert.NotNull(ex);
    }

    [Fact]
    public void UpdateProductSnapshot_ValidData_UpdatesSuccessfully()
    {
        var item = OrderItem.Create(productId: 1, productName: "Test", quantity: 1, unitPrice: 100m);
        
        item.UpdateProductSnapshot(
            productName: "Updated Product",
            imageUrl: "http://example.com/new-image.jpg"
        );

        Assert.Equal("Updated Product", item.ProductName);
        Assert.Equal("http://example.com/new-image.jpg", item.ImageUrl);
    }

    [Fact]
    public void TotalPrice_CalculatesCorrectly()
    {
        var item = OrderItem.Create(productId: 1, productName: "Test", quantity: 3, unitPrice: 25.50m);
        Assert.Equal(76.50m, item.TotalPrice);
    }

    [Fact]
    public void TotalPrice_AfterQuantityUpdate_CalculatesCorrectly()
    {
        var item = OrderItem.Create(productId: 1, productName: "Test", quantity: 2, unitPrice: 50m);
        item.UpdateQuantity(4);
        
        Assert.Equal(200m, item.TotalPrice);
    }

    [Fact]
    public void TotalPrice_AfterPriceUpdate_CalculatesCorrectly()
    {
        var item = OrderItem.Create(productId: 1, productName: "Test", quantity: 5, unitPrice: 20m);
        item.UpdatePrice(30m);
        
        Assert.Equal(150m, item.TotalPrice);
    }

    [Fact]
    public void CreatedAt_IsSetAutomatically()
    {
        var beforeCreation = DateTime.UtcNow;
        var item = OrderItem.Create(productId: 1, productName: "Test", quantity: 1, unitPrice: 100m);
        var afterCreation = DateTime.UtcNow;

        Assert.True(item.CreatedAt >= beforeCreation);
        Assert.True(item.CreatedAt <= afterCreation);
    }
}

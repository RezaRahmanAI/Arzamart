using ECommerce.Core.Domain.Orders;
using Xunit;

namespace ECommerce.Core.Tests.Domain.Orders;

public class OrderStatusTransitionsTests
{
    [Fact]
    public void IsValidTransition_PendingToConfirmed_ReturnsTrue()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Pending, OrderStatus.Confirmed);
        Assert.True(result);
    }

    [Fact]
    public void IsValidTransition_PendingToHold_ReturnsTrue()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Pending, OrderStatus.Hold);
        Assert.True(result);
    }

    [Fact]
    public void IsValidTransition_PendingToCancelled_ReturnsTrue()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Pending, OrderStatus.Cancelled);
        Assert.True(result);
    }

    [Fact]
    public void IsValidTransition_ConfirmedToProcessing_ReturnsTrue()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Confirmed, OrderStatus.Processing);
        Assert.True(result);
    }

    [Fact]
    public void IsValidTransition_ProcessingToPacked_ReturnsTrue()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Processing, OrderStatus.Packed);
        Assert.True(result);
    }

    [Fact]
    public void IsValidTransition_PackedToShipped_ReturnsTrue()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Packed, OrderStatus.Shipped);
        Assert.True(result);
    }

    [Fact]
    public void IsValidTransition_ShippedToDelivered_ReturnsTrue()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Shipped, OrderStatus.Delivered);
        Assert.True(result);
    }

    [Fact]
    public void IsValidTransition_DeliveredToReturn_ReturnsTrue()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Delivered, OrderStatus.Return);
        Assert.True(result);
    }

    [Fact]
    public void IsValidTransition_ReturnToReturnProcess_ReturnsTrue()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Return, OrderStatus.ReturnProcess);
        Assert.True(result);
    }

    [Fact]
    public void IsValidTransition_ReturnProcessToRefund_ReturnsTrue()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.ReturnProcess, OrderStatus.Refund);
        Assert.True(result);
    }

    [Fact]
    public void IsValidTransition_ConfirmedToPending_ReturnsFalse()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Confirmed, OrderStatus.Pending);
        Assert.False(result);
    }

    [Fact]
    public void IsValidTransition_DeliveredToPending_ReturnsFalse()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Delivered, OrderStatus.Pending);
        Assert.False(result);
    }

    [Fact]
    public void IsValidTransition_SameStatus_ReturnsFalse()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Pending, OrderStatus.Pending);
        Assert.False(result);
    }

    [Fact]
    public void IsValidTransition_RefundToAny_ReturnsFalse()
    {
        var result = OrderStatusTransitions.IsValidTransition(OrderStatus.Refund, OrderStatus.Pending);
        Assert.False(result);
    }

    [Fact]
    public void GetValidNextStatuses_Pending_ReturnsExpectedStatuses()
    {
        var statuses = OrderStatusTransitions.GetValidNextStatuses(OrderStatus.Pending);
        
        Assert.Contains(OrderStatus.Confirmed, statuses);
        Assert.Contains(OrderStatus.Hold, statuses);
        Assert.Contains(OrderStatus.Cancelled, statuses);
        Assert.Contains(OrderStatus.PreOrder, statuses);
        Assert.Equal(4, statuses.ToList().Count);
    }

    [Fact]
    public void GetValidNextStatuses_Processing_ReturnsExpectedStatuses()
    {
        var statuses = OrderStatusTransitions.GetValidNextStatuses(OrderStatus.Processing);
        
        Assert.Contains(OrderStatus.Packed, statuses);
        Assert.Contains(OrderStatus.Hold, statuses);
        Assert.Contains(OrderStatus.Return, statuses);
    }

    [Fact]
    public void GetValidNextStatuses_Refund_ReturnsEmpty()
    {
        var statuses = OrderStatusTransitions.GetValidNextStatuses(OrderStatus.Refund);
        Assert.Empty(statuses);
    }

    [Fact]
    public void IsTerminalStatus_Refund_ReturnsTrue()
    {
        var result = OrderStatusTransitions.IsTerminalStatus(OrderStatus.Refund);
        Assert.True(result);
    }

    [Fact]
    public void IsTerminalStatus_Pending_ReturnsFalse()
    {
        var result = OrderStatusTransitions.IsTerminalStatus(OrderStatus.Pending);
        Assert.False(result);
    }

    [Fact]
    public void IsTerminalStatus_Delivered_ReturnsFalse()
    {
        var result = OrderStatusTransitions.IsTerminalStatus(OrderStatus.Delivered);
        Assert.False(result);
    }

    [Fact]
    public void CanBeRefunded_CancelledStatus_ReturnsTrue()
    {
        var result = OrderStatusTransitions.CanBeRefunded(OrderStatus.Cancelled);
        Assert.True(result);
    }

    [Fact]
    public void CanBeRefunded_DeliveredStatus_ReturnsFalse()
    {
        var result = OrderStatusTransitions.CanBeRefunded(OrderStatus.Delivered);
        Assert.False(result);
    }

    [Fact]
    public void GetStatusDescription_Pending_ReturnsDescription()
    {
        var description = OrderStatusTransitions.GetStatusDescription(OrderStatus.Pending);
        Assert.NotEmpty(description);
        Assert.DoesNotContain("Unknown", description);
    }

    [Theory]
    [InlineData(OrderStatus.Pending)]
    [InlineData(OrderStatus.Confirmed)]
    [InlineData(OrderStatus.Processing)]
    [InlineData(OrderStatus.Packed)]
    [InlineData(OrderStatus.Shipped)]
    [InlineData(OrderStatus.Delivered)]
    [InlineData(OrderStatus.Cancelled)]
    [InlineData(OrderStatus.PreOrder)]
    [InlineData(OrderStatus.Hold)]
    [InlineData(OrderStatus.Return)]
    [InlineData(OrderStatus.ReturnProcess)]
    [InlineData(OrderStatus.Refund)]
    [InlineData(OrderStatus.Exchange)]
    public void GetStatusDescription_AllStatuses_HaveDescription(OrderStatus status)
    {
        var description = OrderStatusTransitions.GetStatusDescription(status);
        Assert.NotEmpty(description);
    }
}

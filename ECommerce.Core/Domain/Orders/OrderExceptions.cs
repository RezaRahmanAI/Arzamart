using System;
using ECommerce.Core.Domain.Common;

namespace ECommerce.Core.Domain.Orders;

/// <summary>
/// Thrown when attempting an invalid order status transition.
/// </summary>
public class InvalidOrderStatusTransitionException : DomainException
{
    public OrderStatus CurrentStatus { get; }
    public OrderStatus AttemptedStatus { get; }

    public InvalidOrderStatusTransitionException(OrderStatus currentStatus, OrderStatus attemptedStatus)
        : base(
            $"Cannot transition order from '{currentStatus}' to '{attemptedStatus}'. This transition is not allowed.",
            "INVALID_STATUS_TRANSITION"
        )
    {
        CurrentStatus = currentStatus;
        AttemptedStatus = attemptedStatus;
    }
}

/// <summary>
/// Thrown when order creation fails due to insufficient stock.
/// </summary>
public class InsufficientStockException : DomainException
{
    public int ProductId { get; }
    public string ProductName { get; }
    public string? VariantSize { get; }
    public int RequestedQuantity { get; }
    public int AvailableQuantity { get; }

    public InsufficientStockException(
        int productId,
        string productName,
        int requestedQuantity,
        int availableQuantity,
        string? variantSize = null
    )
        : base(
            $"Insufficient stock for '{productName}'{(variantSize != null ? $" (Size: {variantSize})" : "")}: " +
            $"requested {requestedQuantity}, available {availableQuantity}",
            "INSUFFICIENT_STOCK"
        )
    {
        ProductId = productId;
        ProductName = productName;
        VariantSize = variantSize;
        RequestedQuantity = requestedQuantity;
        AvailableQuantity = availableQuantity;
    }
}

/// <summary>
/// Thrown when an order item's information is invalid.
/// </summary>
public class InvalidOrderItemException : DomainException
{
    public InvalidOrderItemException(string message)
        : base(message, "INVALID_ORDER_ITEM")
    {
    }

    public InvalidOrderItemException(string message, string details)
        : base(message, "INVALID_ORDER_ITEM", details)
    {
    }
}

/// <summary>
/// Thrown when order pricing calculation fails.
/// </summary>
public class InvalidOrderPricingException : DomainException
{
    public InvalidOrderPricingException(string message)
        : base(message, "INVALID_PRICING")
    {
    }
}

/// <summary>
/// Thrown when attempting to modify an order that cannot be modified in its current state.
/// </summary>
public class OrderCannotBeModifiedException : DomainException
{
    public OrderCannotBeModifiedException(int orderId, OrderStatus currentStatus)
        : base(
            $"Order #{orderId} cannot be modified in status '{currentStatus}'.",
            "ORDER_CANNOT_BE_MODIFIED"
        )
    {
    }
}

/// <summary>
/// Thrown when attempting to perform an operation on a non-existent order.
/// </summary>
public class OrderNotFoundException : DomainException
{
    public OrderNotFoundException(int orderId)
        : base($"Order with ID {orderId} not found.", "ORDER_NOT_FOUND")
    {
    }

    public OrderNotFoundException(string orderNumber)
        : base($"Order '{orderNumber}' not found.", "ORDER_NOT_FOUND")
    {
    }
}

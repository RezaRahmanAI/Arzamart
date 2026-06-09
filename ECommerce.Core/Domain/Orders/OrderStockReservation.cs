using System;

namespace ECommerce.Core.Domain.Orders;

/// <summary>
/// Represents a stock reservation for an order item.
/// This entity makes stock reservations explicit and auditable.
/// 
/// Business Rules:
/// - A reservation is created when an order is placed
/// - A reservation is released when order is cancelled or refunded
/// - A reservation is consumed when order is confirmed for fulfillment
/// - Stock is not actually deducted until reservation is consumed
/// </summary>
public class OrderStockReservation
{
    // ============= Identity =============
    public int Id { get; private set; }
    public int OrderId { get; private set; }
    public int OrderItemId { get; private set; }
    public int ProductId { get; private set; }

    // ============= Reservation Details =============
    /// <summary>
    /// The quantity reserved from stock.
    /// </summary>
    public int ReservedQuantity { get; private set; }

    /// <summary>
    /// The product variant size (if applicable).
    /// </summary>
    public string? VariantSize { get; private set; }

    // ============= Reservation Status =============
    public ReservationStatus Status { get; private set; } = ReservationStatus.Reserved;

    // ============= Timeline =============
    public DateTime ReservedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? ConsumedAt { get; private set; }
    public DateTime? ReleasedAt { get; private set; }
    public string? ReleaseReason { get; private set; }

    /// <summary>
    /// Private constructor for ORM and factory methods.
    /// </summary>
    private OrderStockReservation()
    {
    }

    // ============= Factory Methods =============

    /// <summary>
    /// Creates a new stock reservation.
    /// </summary>
    public static OrderStockReservation Create(
        int orderId,
        int orderItemId,
        int productId,
        int reservedQuantity,
        string? variantSize = null)
    {
        // Validation
        if (orderId <= 0)
            throw new InvalidOrderItemException("Order ID must be greater than 0.");

        if (orderItemId <= 0)
            throw new InvalidOrderItemException("Order item ID must be greater than 0.");

        if (productId <= 0)
            throw new InvalidOrderItemException("Product ID must be greater than 0.");

        if (reservedQuantity <= 0)
            throw new InvalidOrderItemException("Reserved quantity must be greater than 0.");

        var reservation = new OrderStockReservation
        {
            OrderId = orderId,
            OrderItemId = orderItemId,
            ProductId = productId,
            ReservedQuantity = reservedQuantity,
            VariantSize = variantSize,
            Status = ReservationStatus.Reserved,
            ReservedAt = DateTime.UtcNow
        };

        return reservation;
    }

    // ============= Business Operations =============

    /// <summary>
    /// Marks this reservation as consumed (stock deducted).
    /// Called when order moves to a fulfillment status.
    /// </summary>
    public void Consume()
    {
        if (Status != ReservationStatus.Reserved)
            throw new InvalidOrderItemException($"Cannot consume reservation in '{Status}' status. Only 'Reserved' reservations can be consumed.");

        Status = ReservationStatus.Consumed;
        ConsumedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Releases the reservation (restores stock).
    /// Called when order is cancelled or returns are processed.
    /// </summary>
    public void Release(string? reason = null)
    {
        if (Status == ReservationStatus.Released)
            throw new InvalidOrderItemException("Reservation is already released.");

        if (Status == ReservationStatus.Consumed && string.IsNullOrWhiteSpace(reason))
            throw new InvalidOrderItemException("Release reason is required when releasing a consumed reservation.");

        Status = ReservationStatus.Released;
        ReleasedAt = DateTime.UtcNow;
        ReleaseReason = reason;
    }

    /// <summary>
    /// Checks if this reservation can be released.
    /// </summary>
    public bool CanBeReleased => Status is ReservationStatus.Reserved or ReservationStatus.Consumed;

    /// <summary>
    /// Checks if this reservation has been used (consumed).
    /// </summary>
    public bool IsConsumed => Status == ReservationStatus.Consumed;

    /// <summary>
    /// Gets the number of days the stock has been reserved.
    /// Useful for identifying long-pending reservations that should be released.
    /// </summary>
    public int DaysReserved
    {
        get
        {
            var endDate = ReleasedAt ?? ConsumedAt ?? DateTime.UtcNow;
            return (int)(endDate - ReservedAt).TotalDays;
        }
    }
}

/// <summary>
/// Represents the status of a stock reservation.
/// </summary>
public enum ReservationStatus
{
    /// <summary>Stock is reserved but not yet deducted from inventory</summary>
    Reserved = 0,

    /// <summary>Stock has been deducted from inventory (used)</summary>
    Consumed = 1,

    /// <summary>Reservation has been released, stock returned to inventory</summary>
    Released = 2
}

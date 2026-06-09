using System;
using System.Collections.Generic;

namespace ECommerce.Core.Domain.Orders;

/// <summary>
/// Represents all possible states in an Order's lifecycle.
/// Uses a state machine pattern to enforce valid transitions.
/// </summary>
public enum OrderStatus
{
    /// <summary>Order created, awaiting confirmation</summary>
    Pending = 0,
    
    /// <summary>Order confirmed by customer or admin</summary>
    Confirmed = 1,
    
    /// <summary>Order is being prepared for shipment</summary>
    Processing = 2,
    
    /// <summary>Order has been packed and ready to ship</summary>
    Packed = 3,
    
    /// <summary>Order has been shipped to customer</summary>
    Shipped = 4,
    
    /// <summary>Order has been delivered to customer</summary>
    Delivered = 5,
    
    /// <summary>Order was cancelled before processing</summary>
    Cancelled = 6,
    
    /// <summary>Order is a pre-order (stock not yet available)</summary>
    PreOrder = 7,
    
    /// <summary>Order is on hold pending customer action or clarification</summary>
    Hold = 8,
    
    /// <summary>Customer initiated return process</summary>
    Return = 9,
    
    /// <summary>Return is being processed by warehouse</summary>
    ReturnProcess = 10,
    
    /// <summary>Return has been refunded to customer</summary>
    Refund = 11,
    
    /// <summary>Order is in exchange process</summary>
    Exchange = 12
}

/// <summary>
/// Provides state machine logic for order status transitions.
/// Enforces business rules about valid status transitions.
/// </summary>
public static class OrderStatusTransitions
{
    /// <summary>
    /// Defines valid transitions from one status to another.
    /// Key: current status, Value: list of allowed next statuses
    /// </summary>
    private static readonly Dictionary<OrderStatus, HashSet<OrderStatus>> ValidTransitions = 
        new Dictionary<OrderStatus, HashSet<OrderStatus>>
    {
        // From Pending
        {
            OrderStatus.Pending, new HashSet<OrderStatus>
            {
                OrderStatus.Confirmed,    // Customer/Admin confirms
                OrderStatus.Hold,         // Put on hold for clarification
                OrderStatus.Cancelled,    // Cancel before confirmation
                OrderStatus.PreOrder      // Auto-convert if stock unavailable
            }
        },
        
        // From Confirmed
        {
            OrderStatus.Confirmed, new HashSet<OrderStatus>
            {
                OrderStatus.Processing,   // Start fulfillment
                OrderStatus.Hold,         // Put on hold
                OrderStatus.Cancelled,    // Cancel after confirmation
                OrderStatus.PreOrder      // Downgrade to pre-order if needed
            }
        },
        
        // From Processing
        {
            OrderStatus.Processing, new HashSet<OrderStatus>
            {
                OrderStatus.Packed,       // Order has been packed
                OrderStatus.Hold,         // Put on hold during processing
                OrderStatus.Return        // Customer initiates return while processing
            }
        },
        
        // From Packed
        {
            OrderStatus.Packed, new HashSet<OrderStatus>
            {
                OrderStatus.Shipped,      // Shipped to customer
                OrderStatus.Hold,         // Hold before shipment
                OrderStatus.Return        // Return initiated before shipment
            }
        },
        
        // From Shipped
        {
            OrderStatus.Shipped, new HashSet<OrderStatus>
            {
                OrderStatus.Delivered,    // Delivered to customer
                OrderStatus.Return        // Return initiated after shipment
            }
        },
        
        // From Delivered
        {
            OrderStatus.Delivered, new HashSet<OrderStatus>
            {
                OrderStatus.Return,       // Return initiated after delivery
                OrderStatus.Exchange      // Exchange initiated after delivery
            }
        },
        
        // From Hold
        {
            OrderStatus.Hold, new HashSet<OrderStatus>
            {
                OrderStatus.Confirmed,    // Resume from hold
                OrderStatus.Processing,   // Process from hold
                OrderStatus.Cancelled,    // Cancel from hold
                OrderStatus.PreOrder      // Convert to pre-order while on hold
            }
        },
        
        // From PreOrder
        {
            OrderStatus.PreOrder, new HashSet<OrderStatus>
            {
                OrderStatus.Confirmed,    // Stock available, resume
                OrderStatus.Cancelled,    // Cancel pre-order
                OrderStatus.Hold          // Hold pre-order
            }
        },
        
        // From Return
        {
            OrderStatus.Return, new HashSet<OrderStatus>
            {
                OrderStatus.ReturnProcess,// Process return
                OrderStatus.Cancelled     // Reject return
            }
        },
        
        // From ReturnProcess
        {
            OrderStatus.ReturnProcess, new HashSet<OrderStatus>
            {
                OrderStatus.Refund,       // Complete refund
                OrderStatus.Exchange      // Exchange instead of refund
            }
        },
        
        // From Exchange
        {
            OrderStatus.Exchange, new HashSet<OrderStatus>
            {
                OrderStatus.Processing,   // Process exchanged order
                OrderStatus.Cancelled     // Cancel exchange
            }
        },
        
        // From Cancelled
        {
            OrderStatus.Cancelled, new HashSet<OrderStatus>
            {
                OrderStatus.Refund        // Process refund if payment was made
            }
        },
        
        // From Refund (terminal state, no transitions)
        {
            OrderStatus.Refund, new HashSet<OrderStatus>()
        }
    };

    /// <summary>
    /// Determines if a transition from currentStatus to newStatus is valid.
    /// </summary>
    /// <param name="currentStatus">The order's current status</param>
    /// <param name="newStatus">The desired new status</param>
    /// <returns>True if transition is allowed, false otherwise</returns>
    public static bool IsValidTransition(OrderStatus currentStatus, OrderStatus newStatus)
    {
        if (currentStatus == newStatus)
            return false; // Cannot transition to same status

        if (!ValidTransitions.TryGetValue(currentStatus, out var allowedNextStatuses))
            return false;

        return allowedNextStatuses.Contains(newStatus);
    }

    /// <summary>
    /// Gets all valid transitions from a given status.
    /// </summary>
    /// <param name="currentStatus">The current order status</param>
    /// <returns>Collection of valid next statuses</returns>
    public static IEnumerable<OrderStatus> GetValidNextStatuses(OrderStatus currentStatus)
    {
        if (ValidTransitions.TryGetValue(currentStatus, out var nextStatuses))
            return nextStatuses;

        return Array.Empty<OrderStatus>();
    }

    /// <summary>
    /// Checks if a status is a terminal state (no further transitions possible).
    /// </summary>
    /// <param name="status">The order status to check</param>
    /// <returns>True if the status is terminal, false otherwise</returns>
    public static bool IsTerminalStatus(OrderStatus status)
    {
        return ValidTransitions.TryGetValue(status, out var nextStatuses) && nextStatuses.Count == 0;
    }

    /// <summary>
    /// Checks if an order can be refunded from its current status.
    /// </summary>
    /// <param name="status">The order status</param>
    /// <returns>True if refund is possible from this status</returns>
    public static bool CanBeRefunded(OrderStatus status)
    {
        return status is OrderStatus.Return or OrderStatus.Cancelled or OrderStatus.Exchange;
    }

    /// <summary>
    /// Gets a user-friendly description of what a status means.
    /// </summary>
    public static string GetStatusDescription(OrderStatus status) => status switch
    {
        OrderStatus.Pending => "Order awaiting confirmation",
        OrderStatus.Confirmed => "Order confirmed, ready for processing",
        OrderStatus.Processing => "Order is being prepared",
        OrderStatus.Packed => "Order packed and ready to ship",
        OrderStatus.Shipped => "Order shipped to customer",
        OrderStatus.Delivered => "Order delivered",
        OrderStatus.Cancelled => "Order cancelled",
        OrderStatus.PreOrder => "Pre-order awaiting stock",
        OrderStatus.Hold => "Order on hold",
        OrderStatus.Return => "Return initiated",
        OrderStatus.ReturnProcess => "Return being processed",
        OrderStatus.Refund => "Refund completed",
        OrderStatus.Exchange => "Exchange in progress",
        _ => "Unknown status"
    };
}

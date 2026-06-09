using System;
using System.Collections.Generic;
using System.Linq;

namespace ECommerce.Core.Domain.Orders;

/// <summary>
/// Represents a customer order in the domain model.
/// Contains all business logic related to order state, validation, and transitions.
/// 
/// This is an aggregate root in Domain-Driven Design terms.
/// It enforces business rules and maintains consistency of its child entities (OrderItems, etc.).
/// </summary>
public class Order
{
    // ============= Identity =============
    public int Id { get; private set; }
    public string OrderNumber { get; private set; } = string.Empty;

    // ============= Customer Information (Snapshot) =============
    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerPhone { get; private set; } = string.Empty;
    public string ShippingAddress { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string Area { get; private set; } = string.Empty;

    // ============= Order Financials =============
    public decimal SubTotal { get; private set; }
    public decimal Tax { get; private set; }
    public decimal ShippingCost { get; private set; }
    public decimal Discount { get; private set; }
    public decimal AdvancePayment { get; private set; }
    public decimal Total => SubTotal + Tax + ShippingCost - Discount;

    // ============= Order Classification =============
    public OrderStatus Status { get; private set; } = OrderStatus.Pending;
    public bool IsPreOrder { get; private set; }

    // ============= Order Details =============
    public int? DeliveryMethodId { get; private set; }
    public int? SourcePageId { get; private set; }
    public int? SocialMediaSourceId { get; private set; }

    // ============= Relationships =============
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    private readonly List<OrderStatusLog> _statusLogs = new();
    public IReadOnlyCollection<OrderStatusLog> StatusLogs => _statusLogs.AsReadOnly();

    // ============= Additional Info =============
    public string? AdminNote { get; private set; }
    public string? CustomerNote { get; private set; }
    public string? CreatedIp { get; private set; }

    // ============= Timestamps =============
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }
    public DateTime? ShippedAt { get; private set; }
    public DateTime? DeliveredAt { get; private set; }

    /// <summary>
    /// Private constructor for ORM and factory methods.
    /// Do not use directly; use factory methods instead.
    /// </summary>
    private Order()
    {
    }

    // ============= Factory Methods =============

    /// <summary>
    /// Creates a new order with initial validation.
    /// </summary>
    public static Order Create(
        string orderNumber,
        string customerName,
        string customerPhone,
        string shippingAddress,
        string city,
        string area,
        IEnumerable<OrderItem> items,
        decimal subTotal,
        decimal tax = 0,
        decimal shippingCost = 0,
        decimal discount = 0,
        decimal advancePayment = 0,
        bool isPreOrder = false,
        int? deliveryMethodId = null,
        int? sourcePageId = null,
        int? socialMediaSourceId = null,
        string? adminNote = null,
        string? customerNote = null,
        string? createdIp = null)
    {
        // Validation
        if (string.IsNullOrWhiteSpace(orderNumber))
            throw new InvalidOrderItemException("Order number cannot be empty.");

        if (string.IsNullOrWhiteSpace(customerName))
            throw new InvalidOrderItemException("Customer name is required.");

        if (string.IsNullOrWhiteSpace(customerPhone))
            throw new InvalidOrderItemException("Customer phone is required.");

        if (string.IsNullOrWhiteSpace(shippingAddress))
            throw new InvalidOrderItemException("Shipping address is required.");

        var itemsList = items.ToList();
        if (!itemsList.Any())
            throw new InvalidOrderItemException("Order must contain at least one item.");

        // Validate item quantities
        foreach (var item in itemsList)
        {
            if (item.Quantity <= 0)
                throw new InvalidOrderItemException($"Item quantity must be positive. Product ID: {item.ProductId}");

            if (item.UnitPrice < 0)
                throw new InvalidOrderPricingException($"Unit price cannot be negative. Product ID: {item.ProductId}");
        }

        // Validate pricing
        if (subTotal < 0)
            throw new InvalidOrderPricingException("Subtotal cannot be negative.");

        if (tax < 0)
            throw new InvalidOrderPricingException("Tax cannot be negative.");

        if (shippingCost < 0)
            throw new InvalidOrderPricingException("Shipping cost cannot be negative.");

        if (discount < 0 || discount > subTotal)
            throw new InvalidOrderPricingException("Discount must be between 0 and subtotal.");

        if (advancePayment < 0 || advancePayment > (subTotal + tax + shippingCost - discount))
            throw new InvalidOrderPricingException("Advance payment cannot exceed total amount.");

        // Create order
        var order = new Order
        {
            OrderNumber = orderNumber,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            ShippingAddress = shippingAddress,
            City = city,
            Area = area,
            SubTotal = subTotal,
            Tax = tax,
            ShippingCost = shippingCost,
            Discount = discount,
            AdvancePayment = advancePayment,
            IsPreOrder = isPreOrder,
            DeliveryMethodId = deliveryMethodId,
            SourcePageId = sourcePageId,
            SocialMediaSourceId = socialMediaSourceId,
            AdminNote = adminNote,
            CustomerNote = customerNote,
            CreatedIp = createdIp,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

        // Add items
        foreach (var item in itemsList)
        {
            order._items.Add(item);
        }

        // Log initial status
        order._statusLogs.Add(new OrderStatusLog(OrderStatus.Pending, null, null, "Order created"));

        return order;
    }

    // ============= Business Operations =============

    /// <summary>
    /// Transitions the order to a new status with validation.
    /// </summary>
    /// <param name="newStatus">The desired new status</param>
    /// <param name="changedBy">Who initiated the change (user/admin name)</param>
    /// <param name="reason">Optional reason for the transition</param>
    /// <exception cref="InvalidOrderStatusTransitionException">If transition is not allowed</exception>
    public void TransitionStatus(OrderStatus newStatus, string? changedBy = null, string? reason = null)
    {
        if (!OrderStatusTransitions.IsValidTransition(Status, newStatus))
        {
            throw new InvalidOrderStatusTransitionException(Status, newStatus);
        }

        var previousStatus = Status;
        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;

        // Record timestamp for specific statuses
        if (newStatus == OrderStatus.Shipped)
            ShippedAt = DateTime.UtcNow;
        else if (newStatus == OrderStatus.Delivered)
            DeliveredAt = DateTime.UtcNow;

        // Log the transition
        _statusLogs.Add(new OrderStatusLog(newStatus, previousStatus, changedBy, reason));
    }

    /// <summary>
    /// Confirms the order (moves from Pending to Confirmed).
    /// </summary>
    public void Confirm(string? changedBy = null)
    {
        TransitionStatus(OrderStatus.Confirmed, changedBy, "Order confirmed");
    }

    /// <summary>
    /// Marks the order as being processed.
    /// </summary>
    public void MarkAsProcessing(string? changedBy = null)
    {
        TransitionStatus(OrderStatus.Processing, changedBy, "Processing started");
    }

    /// <summary>
    /// Marks the order as packed.
    /// </summary>
    public void MarkAsPacked(string? changedBy = null)
    {
        TransitionStatus(OrderStatus.Packed, changedBy, "Order packed");
    }

    /// <summary>
    /// Marks the order as shipped with tracking info.
    /// </summary>
    public void MarkAsShipped(string? changedBy = null)
    {
        TransitionStatus(OrderStatus.Shipped, changedBy, "Order shipped");
    }

    /// <summary>
    /// Marks the order as delivered.
    /// </summary>
    public void MarkAsDelivered(string? changedBy = null)
    {
        TransitionStatus(OrderStatus.Delivered, changedBy, "Order delivered");
    }

    /// <summary>
    /// Cancels the order.
    /// </summary>
    public void Cancel(string? reason = null, string? changedBy = null)
    {
        TransitionStatus(OrderStatus.Cancelled, changedBy, reason ?? "Order cancelled");
    }

    /// <summary>
    /// Puts the order on hold.
    /// </summary>
    public void PutOnHold(string reason, string? changedBy = null)
    {
        TransitionStatus(OrderStatus.Hold, changedBy, reason);
    }

    /// <summary>
    /// Converts order to pre-order status (stock unavailable).
    /// </summary>
    public void ConvertToPreOrder(string? reason = null, string? changedBy = null)
    {
        TransitionStatus(OrderStatus.PreOrder, changedBy, reason ?? "Converted to pre-order due to insufficient stock");
    }

    /// <summary>
    /// Initiates return process.
    /// </summary>
    public void InitiateReturn(string reason, string? changedBy = null)
    {
        TransitionStatus(OrderStatus.Return, changedBy, reason);
    }

    /// <summary>
    /// Marks the order as refunded.
    /// </summary>
    public void MarkAsRefunded(string? reason = null, string? changedBy = null)
    {
        TransitionStatus(OrderStatus.Refund, changedBy, reason ?? "Order refunded");
    }

    /// <summary>
    /// Adds an admin note to the order.
    /// </summary>
    public void AddAdminNote(string note)
    {
        if (string.IsNullOrWhiteSpace(note))
            throw new InvalidOrderItemException("Note cannot be empty.");

        AdminNote = note;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Adds a customer note to the order.
    /// </summary>
    public void AddCustomerNote(string note)
    {
        if (string.IsNullOrWhiteSpace(note))
            throw new InvalidOrderItemException("Note cannot be empty.");

        CustomerNote = note;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Updates financial information.
    /// </summary>
    public void UpdateFinancials(decimal subTotal, decimal tax, decimal shippingCost, decimal discount, decimal advancePayment)
    {
        if (!CanBeModified)
            throw new OrderCannotBeModifiedException(Id, Status);

        if (subTotal < 0 || tax < 0 || shippingCost < 0 || discount < 0 || advancePayment < 0)
            throw new InvalidOrderPricingException("Financial values cannot be negative.");

        SubTotal = subTotal;
        Tax = tax;
        ShippingCost = shippingCost;
        Discount = discount;
        AdvancePayment = advancePayment;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Checks if the order can be cancelled in its current state.
    /// </summary>
    public bool CanBeCancelled => OrderStatusTransitions.IsValidTransition(Status, OrderStatus.Cancelled);

    /// <summary>
    /// Checks if the order can be modified (items, prices, etc.).
    /// Only pending and confirmed orders can be modified.
    /// </summary>
    public bool CanBeModified => Status is OrderStatus.Pending or OrderStatus.Confirmed or OrderStatus.Hold or OrderStatus.PreOrder;

    /// <summary>
    /// Checks if the order is in a terminal state.
    /// </summary>
    public bool IsTerminal => OrderStatusTransitions.IsTerminalStatus(Status);

    /// <summary>
    /// Gets the remaining amount to be paid.
    /// </summary>
    public decimal RemainingAmount => Total - AdvancePayment;

    /// <summary>
    /// Gets the payment status.
    /// </summary>
    public PaymentStatus GetPaymentStatus()
    {
        if (AdvancePayment == 0)
            return PaymentStatus.Unpaid;

        return AdvancePayment >= Total ? PaymentStatus.FullyPaid : PaymentStatus.PartiallyPaid;
    }
}

/// <summary>
/// Represents payment status of an order.
/// </summary>
public enum PaymentStatus
{
    Unpaid,
    PartiallyPaid,
    FullyPaid
}

/// <summary>
/// Represents a log entry for order status transitions.
/// Provides audit trail of all status changes.
/// </summary>
public class OrderStatusLog
{
    public int Id { get; private set; }
    public int OrderId { get; private set; }
    public OrderStatus NewStatus { get; private set; }
    public OrderStatus? PreviousStatus { get; private set; }
    public string? ChangedBy { get; private set; }
    public string? Reason { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public OrderStatusLog(OrderStatus newStatus, OrderStatus? previousStatus = null, string? changedBy = null, string? reason = null)
    {
        NewStatus = newStatus;
        PreviousStatus = previousStatus;
        ChangedBy = changedBy;
        Reason = reason;
        CreatedAt = DateTime.UtcNow;
    }
}

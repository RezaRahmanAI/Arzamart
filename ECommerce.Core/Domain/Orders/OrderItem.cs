using System;

namespace ECommerce.Core.Domain.Orders;

/// <summary>
/// Represents a single item within an order.
/// Stores a snapshot of product information at the time of order to maintain historical accuracy.
/// </summary>
public class OrderItem
{
    // ============= Identity =============
    public int Id { get; private set; }
    public int OrderId { get; private set; }

    // ============= Product Reference & Snapshot =============
    /// <summary>
    /// The product ID this item refers to.
    /// Note: This is kept for reference only. Use ProductSnapshot properties for actual order data.
    /// </summary>
    public int ProductId { get; private set; }

    /// <summary>
    /// Snapshot of the product name at time of order.
    /// Stored because product name might change after order is placed.
    /// </summary>
    public string ProductName { get; private set; } = string.Empty;

    /// <summary>
    /// Product variant size (if applicable).
    /// </summary>
    public string? Size { get; private set; }

    /// <summary>
    /// Snapshot of product image URL at time of order.
    /// </summary>
    public string? ImageUrl { get; private set; }

    // ============= Pricing & Quantity =============
    /// <summary>
    /// Unit price at time of order (not the current product price).
    /// Stored separately because product price might change.
    /// </summary>
    public decimal UnitPrice { get; private set; }

    /// <summary>
    /// Quantity ordered.
    /// </summary>
    public int Quantity { get; private set; }

    /// <summary>
    /// Total price for this item (UnitPrice * Quantity).
    /// </summary>
    public decimal TotalPrice => UnitPrice * Quantity;

    // ============= Timestamps =============
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// Private constructor for ORM and factory methods.
    /// Do not use directly; use factory methods instead.
    /// </summary>
    private OrderItem()
    {
    }

    // ============= Factory Methods =============

    /// <summary>
    /// Creates a new order item with validation.
    /// </summary>
    public static OrderItem Create(
        int productId,
        string productName,
        int quantity,
        decimal unitPrice,
        string? size = null,
        string? imageUrl = null)
    {
        // Validation
        if (productId <= 0)
            throw new InvalidOrderItemException("Product ID must be greater than 0.");

        if (string.IsNullOrWhiteSpace(productName))
            throw new InvalidOrderItemException("Product name is required.");

        if (quantity <= 0)
            throw new InvalidOrderItemException("Quantity must be greater than 0.");

        if (unitPrice < 0)
            throw new InvalidOrderPricingException("Unit price cannot be negative.");

        // Create order item
        var item = new OrderItem
        {
            ProductId = productId,
            ProductName = productName,
            Quantity = quantity,
            UnitPrice = unitPrice,
            Size = size,
            ImageUrl = imageUrl,
            CreatedAt = DateTime.UtcNow
        };

        return item;
    }

    // ============= Business Operations =============

    /// <summary>
    /// Updates the quantity of this order item.
    /// Used when modifying an order before confirmation.
    /// </summary>
    public void UpdateQuantity(int newQuantity)
    {
        if (newQuantity <= 0)
            throw new InvalidOrderItemException("Quantity must be greater than 0.");

        Quantity = newQuantity;
    }

    /// <summary>
    /// Updates the unit price.
    /// Used for price adjustments before order confirmation.
    /// </summary>
    public void UpdatePrice(decimal newPrice)
    {
        if (newPrice < 0)
            throw new InvalidOrderPricingException("Unit price cannot be negative.");

        UnitPrice = newPrice;
    }

    /// <summary>
    /// Updates the product snapshot information.
    /// This ensures the order maintains accurate product data even if the product is later modified.
    /// </summary>
    public void UpdateProductSnapshot(string productName, string? imageUrl = null)
    {
        if (string.IsNullOrWhiteSpace(productName))
            throw new InvalidOrderItemException("Product name is required.");

        ProductName = productName;
        ImageUrl = imageUrl;
    }
}

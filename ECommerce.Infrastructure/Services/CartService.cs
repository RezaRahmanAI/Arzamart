using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;

namespace ECommerce.Infrastructure.Services;

public class CartService : ICartService
{
    private readonly IUnitOfWork _unitOfWork;

    public CartService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CartDto> GetCartAsync(string? userId, string? sessionId)
    {
        var cart = await GetOrCreateCartAsync(userId, sessionId);
        return MapToDto(cart);
    }

    public async Task<CartDto> AddItemAsync(string? userId, string? sessionId, AddToCartDto dto)
    {
        var cart = await GetOrCreateCartAsync(userId, sessionId);

        var productExists = await _unitOfWork.Repository<Product>()
            .GetQueryable()
            .AsNoTracking()
            .AnyAsync(p => p.Id == dto.ProductId && p.IsActive);

        if (!productExists)
            throw new KeyNotFoundException("Product not found");

        var existingItem = cart.Items.FirstOrDefault(i =>
            i.ProductId == dto.ProductId &&
            i.Size == dto.Size);

        if (existingItem != null)
        {
            existingItem.Quantity += dto.Quantity;
        }
        else
        {
            cart.Items.Add(new CartItem
            {
                ProductId = dto.ProductId,
                Size = dto.Size ?? string.Empty,
                Quantity = dto.Quantity
            });
        }

        await _unitOfWork.Complete();

        var updatedCart = await GetCartQuery(cart.Id).FirstAsync();
        return MapToDto(updatedCart);
    }

    public async Task<CartDto> UpdateItemAsync(int itemId, string? userId, string? sessionId, int quantity)
    {
        var item = await _unitOfWork.Repository<CartItem>()
            .GetQueryable()
            .Include(i => i.Cart)
            .FirstOrDefaultAsync(i => i.Id == itemId);

        if (item == null)
            throw new KeyNotFoundException("Cart item not found");

        if (!string.IsNullOrEmpty(userId))
        {
            if (item.Cart?.UserId != userId)
                throw new UnauthorizedAccessException();
        }
        else if (!string.IsNullOrEmpty(sessionId))
        {
            if (item.Cart?.SessionId != sessionId)
                throw new UnauthorizedAccessException();
        }
        else
            throw new UnauthorizedAccessException();

        if (quantity <= 0)
        {
            _unitOfWork.Repository<CartItem>().Delete(item);
        }
        else
        {
            item.Quantity = quantity;
            _unitOfWork.Repository<CartItem>().Update(item);
        }

        await _unitOfWork.Complete();

        var cart = await GetCartQuery(item.CartId).FirstAsync();
        return MapToDto(cart);
    }

    public async Task<CartDto> RemoveItemAsync(int itemId, string? userId, string? sessionId)
    {
        var cart = await GetOrCreateCartAsync(userId, sessionId);
        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);

        if (item != null)
        {
            cart.Items.Remove(item);
            await _unitOfWork.Complete();
        }

        cart = await GetCartQuery(cart.Id).FirstAsync();
        return MapToDto(cart);
    }

    public async Task ClearCartAsync(string? userId, string? sessionId)
    {
        var cart = await GetOrCreateCartAsync(userId, sessionId);
        var repo = _unitOfWork.Repository<CartItem>();
        foreach (var item in cart.Items.ToList())
        {
            repo.Delete(item);
        }
        await _unitOfWork.Complete();
    }

    public async Task<CartDto> MergeGuestCartAsync(string sessionId, string userId)
    {
        var guestCart = await GetCartQuery()
            .FirstOrDefaultAsync(c => c.SessionId == sessionId && string.IsNullOrEmpty(c.UserId));

        var userCart = await GetOrCreateCartAsync(userId, null);

        if (guestCart != null && guestCart.Items.Any())
        {
            foreach (var item in guestCart.Items)
            {
                var existingItem = userCart.Items.FirstOrDefault(i =>
                    i.ProductId == item.ProductId &&
                    i.Size == item.Size);

                if (existingItem != null)
                {
                    existingItem.Quantity += item.Quantity;
                }
                else
                {
                    userCart.Items.Add(new CartItem
                    {
                        ProductId = item.ProductId,
                        Size = item.Size,
                        Quantity = item.Quantity
                    });
                }
            }

            _unitOfWork.Repository<Cart>().Delete(guestCart);
            await _unitOfWork.Complete();
        }

        userCart = await GetCartQuery(userCart.Id).FirstAsync();
        return MapToDto(userCart);
    }

    private async Task<Cart> GetOrCreateCartAsync(string? userId, string? sessionId)
    {
        Cart? cart = null;

        if (!string.IsNullOrEmpty(userId))
        {
            cart = await GetCartQuery().FirstOrDefaultAsync(c => c.UserId == userId);
        }
        else if (!string.IsNullOrEmpty(sessionId))
        {
            cart = await GetCartQuery().FirstOrDefaultAsync(c => c.SessionId == sessionId && c.UserId == null);
        }

        if (cart == null)
        {
            var finalSessionId = sessionId;
            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(finalSessionId))
            {
                finalSessionId = Guid.NewGuid().ToString();
            }

            cart = new Cart
            {
                UserId = userId,
                SessionId = string.IsNullOrEmpty(userId) ? finalSessionId : null,
                Items = new List<CartItem>()
            };

            _unitOfWork.Repository<Cart>().Add(cart);
            await _unitOfWork.Complete();
        }

        return cart;
    }

    private IQueryable<Cart> GetCartQuery(int? id = null)
    {
        var query = _unitOfWork.Repository<Cart>().GetQueryable();

        if (id.HasValue)
        {
            query = query.Where(c => c.Id == id.Value);
        }

        return query.Include(c => c.Items)
                .ThenInclude(i => i.Product!)
                    .ThenInclude(p => p!.Images)
                .Include(c => c.Items)
                .ThenInclude(i => i.Product!)
                    .ThenInclude(p => p!.Variants);
    }

    private CartDto MapToDto(Cart cart)
    {
        var dto = new CartDto
        {
            Id = cart.Id,
            UserId = cart.UserId,
            GuestId = cart.GuestId,
            SessionId = cart.SessionId,
            Items = cart.Items.Select(i =>
            {
                var normalizedSize = (i.Size ?? "").Trim().ToLower();
                var variant = i.Product?.Variants?.FirstOrDefault(v =>
                    v.Size != null && v.Size.Trim().ToLower() == normalizedSize);

                decimal price = 0;
                decimal? salePrice = null;

                if (variant != null && (variant.Price ?? 0) > 0)
                {
                    price = variant.Price ?? 0;
                    salePrice = variant.CompareAtPrice;
                }
                else
                {
                    var validVariants = i.Product?.Variants?.Where(v => (v.Price ?? 0) > 0).ToList();
                    if (validVariants != null && validVariants.Any())
                    {
                        var minVariant = validVariants.OrderBy(v => v.Price).First();
                        price = minVariant.Price ?? 0;
                        salePrice = minVariant.CompareAtPrice;
                    }
                }

                return new CartItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = i.Product?.Name ?? "Unknown",
                    ProductSlug = i.Product?.Slug ?? "",
                    ImageUrl = i.Product?.Images?.FirstOrDefault(img => img.IsMain)?.Url ?? "",
                    Price = price,
                    SalePrice = salePrice,
                    Quantity = i.Quantity,
                    Size = i.Size ?? string.Empty,
                    AvailableStock = variant?.StockQuantity ?? 0
                };
            }).ToList()
        };

        dto.Subtotal = dto.Items.Sum(i => i.Price * i.Quantity);
        dto.TotalItems = dto.Items.Sum(i => i.Quantity);

        return dto;
    }
}

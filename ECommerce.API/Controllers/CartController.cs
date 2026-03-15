using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerce.Infrastructure.Data;
using ECommerce.Core.Entities;
using ECommerce.Core.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CartController> _logger;

    public CartController(ApplicationDbContext context, ILogger<CartController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private string? GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
    private string? GetSessionId()
    {
        var headers = Request.Headers;
        if (headers.TryGetValue("X-Session-Id", out var sessionId))
        {
            var val = sessionId.ToString().Trim();
            // Sanitize against common invalid string literals from bad localStorage states
            if (!string.IsNullOrEmpty(val) && val != "null" && val != "undefined" && val.Length >= 10)
            {
                return val;
            }
        }
        return null; 
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<CartDto>> GetCart()
    {
        var cart = await GetOrCreateCartAsync();
        return Ok(MapToDto(cart));
    }

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> AddItem(AddToCartDto dto)
    {
        var cart = await GetOrCreateCartAsync();
        
        var product = await _context.Products
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId && p.IsActive);
            
        if (product == null) return NotFound("Product not found");

        var normalizedSize = (dto.Size ?? "").Trim().ToLower();
        var variant = product.Variants.FirstOrDefault(v => 
            v.Size != null && v.Size.Trim().ToLower() == normalizedSize);
            
        if (variant != null && variant.StockQuantity < dto.Quantity)
        {
            return BadRequest("Insufficient stock");
        }

        var existingItem = cart.Items.FirstOrDefault(i => 
            i.ProductId == dto.ProductId && 
            i.Color == dto.Color && 
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
                Color = dto.Color,
                Size = dto.Size,
                Quantity = dto.Quantity
            });
        }

        await _context.SaveChangesAsync();
        
        // Reload cart items to get proper product mapping
        cart = await GetCartQuery(cart.Id).FirstAsync();
        return Ok(MapToDto(cart));
    }

    [HttpPost("items/{id}")]
    public async Task<ActionResult<CartDto>> UpdateItem(int id, UpdateCartItemDto dto)
    {
        // Faster lookup: directly fetch the item and its cart
        var item = await _context.CartItems
            .Include(i => i.Cart)
            .FirstOrDefaultAsync(i => i.Id == id);
        
        if (item == null) return NotFound();

        var userId = GetUserId();
        var sessionId = GetSessionId();
        
        if (!string.IsNullOrEmpty(userId))
        {
            if (item.Cart.UserId != userId) return Unauthorized();
        }
        else if (!string.IsNullOrEmpty(sessionId))
        {
            if (item.Cart.SessionId != sessionId) return Unauthorized();
        }
        else return Unauthorized();

        if (dto.Quantity <= 0)
        {
           _context.CartItems.Remove(item);
        }
        else
        {
            item.Quantity = dto.Quantity;
        }

        await _context.SaveChangesAsync();
        
        // Return refreshed cart
        var cart = await GetCartQuery(item.CartId).FirstAsync();
        return Ok(MapToDto(cart));
    }

    [HttpPost("items/{id}/delete")]
    public async Task<ActionResult<CartDto>> RemoveItem(int id)
    {
        _logger.LogInformation("Processing DELETE request for cart item {id}", id);
        
        var cart = await GetOrCreateCartAsync();
        var item = cart.Items.FirstOrDefault(i => i.Id == id);
        
        if (item != null)
        {
            _logger.LogInformation("Found item {id} in cart {cartId}. Removing...", id, cart.Id);
            cart.Items.Remove(item);
            await _context.SaveChangesAsync();
        }
        else
        {
            _logger.LogWarning("Item {id} not found in cart {cartId}", id, cart.Id);
        }

        cart = await GetCartQuery(cart.Id).FirstAsync();
        return Ok(MapToDto(cart));
    }

    [HttpPost("delete")]
    public async Task<ActionResult> ClearCart()
    {
        var cart = await GetOrCreateCartAsync();
        _context.CartItems.RemoveRange(cart.Items);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("merge")]
    public async Task<ActionResult<CartDto>> MergeGuestCart([FromQuery] string sessionId)
    {
        if (string.IsNullOrEmpty(sessionId)) return BadRequest("SessionId required");

        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var guestCart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.SessionId == sessionId && string.IsNullOrEmpty(c.UserId));

        var userCart = await GetOrCreateCartAsync();

        if (guestCart != null && guestCart.Items.Any())
        {
            foreach (var item in guestCart.Items)
            {
                var existingItem = userCart.Items.FirstOrDefault(i => 
                    i.ProductId == item.ProductId && 
                    i.Color == item.Color && 
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
                        Color = item.Color,
                        Size = item.Size,
                        Quantity = item.Quantity
                    });
                }
            }

            _context.Carts.Remove(guestCart);
            await _context.SaveChangesAsync();
        }

        userCart = await GetCartQuery(userCart.Id).FirstAsync();
        return Ok(MapToDto(userCart));
    }

    private async Task<Cart> GetOrCreateCartAsync()
    {
        var userId = GetUserId();
        var sessionId = GetSessionId();

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
            // If the user is a guest but didn't provide a valid SessionId (e.g. because we stripped an invalid one),
            // generate a fresh distinct one for the database to avoid orphaned carts grouping together on SessionId = null
            var finalSessionId = sessionId;
            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(finalSessionId))
            {
                finalSessionId = Guid.NewGuid().ToString();
            }

            cart = new Cart
            {
                UserId = userId,
                SessionId = string.IsNullOrEmpty(userId) ? finalSessionId : null
            };
            
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }

        return cart;
    }

    private IQueryable<Cart> GetCartQuery(int? id = null)
    {
        var query = _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images)
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Variants)
            .AsSplitQuery()
            .AsQueryable();

        if (id.HasValue)
        {
            query = query.Where(c => c.Id == id.Value);
        }

        return query;
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
                    price = variant.Price.Value;
                    salePrice = variant.CompareAtPrice;
                }
                else
                {
                    // Fallback: Get min variant price
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
                    Color = i.Color,
                    Size = i.Size,
                    AvailableStock = variant?.StockQuantity ?? 0
                };
            }).ToList()
        };

        dto.Subtotal = dto.Items.Sum(i => i.Price * i.Quantity);
        dto.TotalItems = dto.Items.Sum(i => i.Quantity);

        return dto;
    }
}

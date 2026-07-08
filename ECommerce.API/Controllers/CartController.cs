using Microsoft.AspNetCore.Mvc;
using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Memory;
using AppConstants = ECommerce.Core.Constants;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;
    private readonly ILogger<CartController> _logger;
    private readonly IMemoryCache _cache;
    private const string SessionCookieName = "cart_sid";
    private const string SessionHeaderName = "X-Session-Id";

    public CartController(ICartService cartService, ILogger<CartController> logger, IMemoryCache cache)
    {
        _cartService = cartService;
        _logger = logger;
        _cache = cache;
    }

    private string? GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    private string? GetSessionId()
    {
        if (Request.Cookies.TryGetValue(SessionCookieName, out var cookieVal) &&
            !string.IsNullOrEmpty(cookieVal) && cookieVal.Length >= 10)
        {
            return cookieVal;
        }

        if (Request.Headers.TryGetValue(SessionHeaderName, out var headerVal))
        {
            var val = headerVal.ToString().Trim();
            if (!string.IsNullOrEmpty(val) && val != "null" && val != "undefined" && val.Length >= 10)
            {
                return val;
            }
        }

        return null;
    }

    private string EnsureSessionId()
    {
        var existing = GetSessionId();
        if (!string.IsNullOrEmpty(existing)) return existing;

        var sessionId = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        Response.Cookies.Append(SessionCookieName, sessionId, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = true,
            MaxAge = TimeSpan.FromDays(30),
            Path = "/"
        });
        return sessionId;
    }

    private string GetCacheKey(string? overrideSessionId = null)
    {
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId)) return $"cart_{userId}";

        var sessionId = overrideSessionId ?? GetSessionId();
        if (!string.IsNullOrEmpty(sessionId)) return $"cart_{sessionId}";

        return string.Empty;
    }

    /// <summary>
    /// Invalidates the cart cache and sets it to the latest cart state.
    /// Must be called BEFORE returning the response for any mutation.
    /// </summary>
    private void SetCache(string cacheKey, CartDto dto)
    {
        if (!string.IsNullOrEmpty(cacheKey))
        {
            _cache.Set(cacheKey, dto, AppConstants.CacheDurations.Medium);
        }
    }

    /// <summary>
    /// Invalidates (removes) the cart cache entirely.
    /// </summary>
    private void InvalidateCache(string cacheKey)
    {
        if (!string.IsNullOrEmpty(cacheKey))
        {
            _cache.Remove(cacheKey);
        }
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<CartDto>> GetCart()
    {
        // ALWAYS fetch from the database to guarantee consistency.
        // The database is the single source of truth.
        // AppCache is only used for mutation responses (write-through).
        var cacheKey = GetCacheKey();
        var dto = await _cartService.GetCartAsync(GetUserId(), GetSessionId());

        // Update cache with the fresh database state
        SetCache(cacheKey, dto);

        return Ok(dto);
    }

    [HttpPost("items")]
    public async Task<ActionResult> AddItem([FromBody] AddToCartDto dto)
    {
        try
        {
            var sessionId = EnsureSessionId();
            var cartDto = await _cartService.AddItemAsync(GetUserId(), sessionId, dto);

            // Cache updated BEFORE response is returned
            SetCache(GetCacheKey(sessionId), cartDto);

            return Ok(cartDto);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost("items/{id}")]
    public async Task<ActionResult<CartDto>> UpdateItem(int id, [FromBody] UpdateCartItemDto dto)
    {
        try
        {
            var cartDto = await _cartService.UpdateItemAsync(id, GetUserId(), GetSessionId(), dto.Quantity);

            // Cache updated BEFORE response is returned
            SetCache(GetCacheKey(), cartDto);

            return Ok(cartDto);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    [HttpPost("items/{id}/delete")]
    public async Task<ActionResult<CartDto>> RemoveItem(int id)
    {
        _logger.LogInformation("Processing DELETE request for cart item {id}", id);

        var cartDto = await _cartService.RemoveItemAsync(id, GetUserId(), GetSessionId());

        // Cache updated BEFORE response is returned
        SetCache(GetCacheKey(), cartDto);

        return Ok(cartDto);
    }

    [HttpPost("clear")]
    public async Task<ActionResult<CartDto>> ClearCart()
    {
        var cacheKey = GetCacheKey();

        // ClearCartAsync now returns the empty cart DTO
        var cartDto = await _cartService.ClearCartAsync(GetUserId(), GetSessionId());

        // Update cache with the empty cart (not just remove — prevents stale re-creation)
        SetCache(cacheKey, cartDto);

        // Return the empty cart DTO so the frontend can reconcile
        return Ok(cartDto);
    }

    [Authorize]
    [HttpPost("merge")]
    public async Task<ActionResult<CartDto>> MergeGuestCart([FromQuery] string sessionId)
    {
        if (string.IsNullOrEmpty(sessionId)) return BadRequest("SessionId required");

        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var cartDto = await _cartService.MergeGuestCartAsync(sessionId, userId);

        // Invalidate both the guest cache key and set the user cache key
        var guestCacheKey = $"cart_{sessionId}";
        InvalidateCache(guestCacheKey);
        SetCache(GetCacheKey(), cartDto);

        return Ok(cartDto);
    }
}

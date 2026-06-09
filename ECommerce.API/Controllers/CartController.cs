using Microsoft.AspNetCore.Mvc;
using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using System.Security.Claims;
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

    public CartController(ICartService cartService, ILogger<CartController> logger, IMemoryCache cache)
    {
        _cartService = cartService;
        _logger = logger;
        _cache = cache;
    }

    private string? GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    private string? GetSessionId()
    {
        var headers = Request.Headers;
        if (headers.TryGetValue("X-Session-Id", out var sessionId))
        {
            var val = sessionId.ToString().Trim();
            if (!string.IsNullOrEmpty(val) && val != "null" && val != "undefined" && val.Length >= 10)
            {
                return val;
            }
        }
        return null;
    }

    private string GetCacheKey()
    {
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId)) return $"cart_{userId}";

        var sessionId = GetSessionId();
        if (!string.IsNullOrEmpty(sessionId)) return $"cart_{sessionId}";

        return string.Empty;
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<CartDto>> GetCart()
    {
        var cacheKey = GetCacheKey();
        if (!string.IsNullOrEmpty(cacheKey) && _cache.TryGetValue(cacheKey, out CartDto? cachedCart))
        {
            return Ok(cachedCart);
        }

        var dto = await _cartService.GetCartAsync(GetUserId(), GetSessionId());

        if (!string.IsNullOrEmpty(cacheKey))
        {
            _cache.Set(cacheKey, dto, AppConstants.CacheDurations.Medium);
        }

        return Ok(dto);
    }

    [HttpPost("items")]
    public async Task<ActionResult> AddItem(AddToCartDto dto)
    {
        try
        {
            var cartDto = await _cartService.AddItemAsync(GetUserId(), GetSessionId(), dto);

            var cacheKey = GetCacheKey();
            if (!string.IsNullOrEmpty(cacheKey))
            {
                _cache.Set(cacheKey, cartDto, AppConstants.CacheDurations.Medium);
            }

            return Ok(cartDto);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost("items/{id}")]
    public async Task<ActionResult<CartDto>> UpdateItem(int id, UpdateCartItemDto dto)
    {
        try
        {
            var cartDto = await _cartService.UpdateItemAsync(id, GetUserId(), GetSessionId(), dto.Quantity);

            var cacheKey = GetCacheKey();
            if (!string.IsNullOrEmpty(cacheKey))
            {
                _cache.Set(cacheKey, cartDto, AppConstants.CacheDurations.Medium);
            }

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

    [HttpDelete("items/{id}")]
    public async Task<ActionResult<CartDto>> RemoveItem(int id)
    {
        _logger.LogInformation("Processing DELETE request for cart item {id}", id);

        var cartDto = await _cartService.RemoveItemAsync(id, GetUserId(), GetSessionId());

        var cacheKey = GetCacheKey();
        if (!string.IsNullOrEmpty(cacheKey))
        {
            _cache.Set(cacheKey, cartDto, AppConstants.CacheDurations.Medium);
        }

        return Ok(cartDto);
    }

    [HttpDelete]
    public async Task<ActionResult> ClearCart()
    {
        await _cartService.ClearCartAsync(GetUserId(), GetSessionId());

        var cacheKey = GetCacheKey();
        if (!string.IsNullOrEmpty(cacheKey)) _cache.Remove(cacheKey);

        return NoContent();
    }

    [HttpPost("merge")]
    public async Task<ActionResult<CartDto>> MergeGuestCart([FromQuery] string sessionId)
    {
        if (string.IsNullOrEmpty(sessionId)) return BadRequest("SessionId required");

        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var cartDto = await _cartService.MergeGuestCartAsync(sessionId, userId);

        var cacheKey = GetCacheKey();
        if (!string.IsNullOrEmpty(cacheKey))
        {
            _cache.Set(cacheKey, cartDto, AppConstants.CacheDurations.Medium);
        }

        return Ok(cartDto);
    }
}

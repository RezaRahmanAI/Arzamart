using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface ICartService
{
    Task<CartDto> GetCartAsync(string? userId, string? sessionId);
    Task<CartDto> AddItemAsync(string? userId, string? sessionId, AddToCartDto dto);
    Task<CartDto> UpdateItemAsync(int itemId, string? userId, string? sessionId, int quantity);
    Task<CartDto> RemoveItemAsync(int itemId, string? userId, string? sessionId);
    Task<CartDto> ClearCartAsync(string? userId, string? sessionId);
    Task<CartDto> MergeGuestCartAsync(string sessionId, string userId);
}

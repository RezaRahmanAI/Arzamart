using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IInventoryService
{
    Task<List<ProductInventoryDto>> GetInventoryAsync();
    Task UpdateStockAsync(int variantId, UpdateInventoryDto dto);
    Task UpdateProductStockAsync(int productId, UpdateInventoryDto dto);
    Task<int> SyncAllInventoryAsync();
}

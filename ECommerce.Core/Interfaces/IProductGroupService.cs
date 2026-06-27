using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces;

public interface IProductGroupService
{
    Task<IReadOnlyList<ProductGroup>> GetAllAsync();
    Task<ProductGroup?> GetByIdAsync(int id);
    Task<ProductGroup> CreateAsync(ProductGroup group);
    Task UpdateAsync(int id, ProductGroup group);
    Task DeleteAsync(int id);
    Task AddProductToGroupAsync(int groupId, int productId);
    Task RemoveProductFromGroupAsync(int groupId, int productId);
}

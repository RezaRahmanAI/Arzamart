using ECommerce.Core.DTOs;
using ECommerce.Core.DTOs.Products;

namespace ECommerce.Core.Interfaces;

public interface IProductService
{
    Task<ProductDto?> GetProductBySlugAsync(string slug);
    Task<ProductDto?> GetProductByIdAsync(int id, bool ignoreFilters = false);
    Task<AdminProductListResultDto> GetAdminProductsAsync(string? searchTerm, string? category, string? statusTab, string? stockStatus, int page, int pageSize);
    Task<ProductDto?> CreateProductAsync(ProductCreateDto dto);
    Task<ProductDto?> UpdateProductAsync(int id, ProductUpdateDto dto, bool ignoreFilters = false);
    Task<(bool Success, string? MainImageUrl, List<string> ImageUrls)> DeleteProductAsync(int id);
    Task<List<ProductSearchResultDto>> SearchProductsForComboAsync(string? q);
    Task<List<ProductCatalogItemDto>> GetProductCatalogAsync();
    Task<List<string>> GetAvailableSizesAsync();
}

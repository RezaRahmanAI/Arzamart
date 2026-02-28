using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Specifications;

namespace ECommerce.Core.Interfaces;

public interface IProductService
{
    Task<ProductDto> GetProductBySlugAsync(string slug);
    Task<ProductDto> GetProductByIdAsync(int id);

    Task<ProductDto> CreateProductAsync(ProductCreateDto dto);
    Task<ProductDto> UpdateProductAsync(int id, ProductUpdateDto dto);
    Task<List<string>> GetAvailableSizesAsync();
    int CalculateEffectiveStock(Product product);
}

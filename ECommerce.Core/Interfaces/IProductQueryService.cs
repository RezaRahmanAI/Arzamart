using System.Collections.Generic;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IProductQueryService
{
    Task<PaginationDto<ProductListDto>> GetProductsAsync(
        string? sort,
        int? categoryId,
        int? subCategoryId,
        int? collectionId,
        string? categorySlug,
        string? subCategorySlug,
        string? collectionSlug,
        string? searchTerm,
        string? tier,
        string? tags,
        bool? isNew,
        bool? isFeatured,
        int pageIndex,
        int pageSize,
        int? productGroupId,
        int? productType);

    Task<IReadOnlyList<ProductListDto>> GetProductsByIdsAsync(List<int> ids);

    Task<ProductDto?> GetProductBySlugAsync(string slug);
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Specifications;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.Enums;
using ECommerce.Core.DTOs.Products;
using ECommerce.Core.Constants;
using ECommerce.Infrastructure.Cache;
using Microsoft.Extensions.DependencyInjection;

namespace ECommerce.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly AppCache _cache;
    private readonly ApplicationDbContext _db;
    private readonly IServiceScopeFactory _scopeFactory;

    public ProductService(IUnitOfWork unitOfWork, IMapper mapper, AppCache cache, ApplicationDbContext db, IServiceScopeFactory scopeFactory)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _cache = cache;
        _db = db;
        _scopeFactory = scopeFactory;
    }

    public Task<ProductDto?> GetProductBySlugAsync(string slug)
    {
        var product = _cache.Products.Values.FirstOrDefault(p => p.Slug == slug);
        return Task.FromResult(product == null ? null : _mapper.Map<ProductDto>(product));
    }

    public Task<ProductDto?> GetProductByIdAsync(int id, bool ignoreFilters = false)
    {
        _cache.Products.TryGetValue(id, out var product);
        return Task.FromResult(product == null ? null : _mapper.Map<ProductDto>(product));
    }

    public async Task<AdminProductListResultDto> GetAdminProductsAsync(string? searchTerm, string? category, string? statusTab, string? stockStatus, int page, int pageSize)
    {
        var query = _db.Products
            .IgnoreQueryFilters()
            .AsNoTracking();

        if (!string.IsNullOrEmpty(searchTerm))
            query = query.Where(p => p.Name.Contains(searchTerm) || (p.Sku ?? "").Contains(searchTerm));

        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            var dbCat = await _db.Categories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == category.ToLower());
            if (dbCat != null)
                query = query.Where(p => p.CategoryId == dbCat.Id);
        }

        if (!string.IsNullOrEmpty(statusTab) && statusTab != "all")
        {
            bool isActive = statusTab.ToLower() == "active";
            query = query.Where(p => p.IsActive == isActive);
        }

        if (!string.IsNullOrEmpty(stockStatus) && stockStatus != "all")
        {
            if (stockStatus.ToLower() == "instock")
                query = query.Where(p => p.StockQuantity > 0);
            else if (stockStatus.ToLower() == "outofstock")
                query = query.Where(p => p.StockQuantity <= 0);
        }

        var total = await query.CountAsync();
        var rawProducts = await query
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .AsSplitQuery()
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var products = rawProducts.Select(p => new AdminProductListItemDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            ShortDescription = p.ShortDescription,
            Sku = p.Sku,
            Price = p.Variants.FirstOrDefault()?.Price ?? 0,
            SalePrice = p.Variants.FirstOrDefault()?.CompareAtPrice,
            PurchaseRate = p.Variants.FirstOrDefault()?.PurchaseRate,
            StockQuantity = p.Variants.Any() ? p.Variants.Sum(v => v.StockQuantity) : p.StockQuantity,
            IsNew = p.IsNew,
            IsFeatured = p.IsFeatured,
            Status = p.IsActive ? "Active" : "Draft",
            ImageUrl = p.ImageUrl,
            Category = p.Category?.Name ?? "",
            SubCategory = p.SubCategory?.Name ?? "",
            CategoryId = p.CategoryId,
            MediaUrls = p.Images.Select(i => i.Url).ToList(),
            Images = p.Images.Select(i => new ProductImageDto { ImageUrl = i.Url }).ToList(),
            Variants = p.Variants.Select(v => new ProductVariantDto { Id = v.Id, Size = v.Size, StockQuantity = v.StockQuantity, Price = v.Price }).ToList(),
            Tier = p.Tier,
            Tags = p.Tags,
            SortOrder = p.SortOrder,
            CreatedAt = p.CreatedAt,
            Slug = p.Slug
        }).ToList();

        return new AdminProductListResultDto { Items = products, Total = total };
    }

    public async Task<(bool Success, string? MainImageUrl, List<string> ImageUrls)> DeleteProductAsync(int id)
    {
        var product = await _unitOfWork.Repository<Product>().GetQueryable()
            .IgnoreQueryFilters()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return (false, null, new List<string>());

        var mainImageUrl = product.ImageUrl;
        var imageUrls = product.Images.Select(i => i.Url).ToList();

        var clpConfig = await _unitOfWork.Repository<CustomLandingPageConfig>().GetQueryable()
            .FirstOrDefaultAsync(c => c.ProductId == id);
        if (clpConfig != null)
            _unitOfWork.Repository<CustomLandingPageConfig>().Delete(clpConfig);

        try
        {
            _unitOfWork.Repository<Product>().Delete(product);
            await _unitOfWork.Complete();
            _cache.Products.TryRemove(id, out _);
            RebuildHomePageCache();
            return (true, mainImageUrl, imageUrls);
        }
        catch
        {
            return (false, null, new List<string>());
        }
    }

    public async Task<ProductDto?> CreateProductAsync(ProductCreateDto dto)
    {
        int.TryParse(dto.Category, out int catId);
        var category = await _unitOfWork.Repository<Category>().GetQueryable()
            .FirstOrDefaultAsync(c => c.Name.ToLower() == dto.Category.ToLower() || (catId != 0 && c.Id == catId));
        
        if (category == null) throw new KeyNotFoundException($"Category {dto.Category} not found");

        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            ShortDescription = dto.ShortDescription,
            StockQuantity = dto.InventoryVariants.Sum(v => v.Inventory),
            IsActive = dto.StatusActive,
            CategoryId = category.Id,
            ImageUrl = dto.Media?.MainImage?.ImageUrl ?? string.Empty,
            IsNew = dto.NewArrival,
            IsFeatured = dto.IsFeatured,
            Slug = await GenerateUniqueSlugAsync(dto.Name),
            Sku = $"PRD-{DateTime.UtcNow.Ticks}",
            FabricAndCare = dto.Meta?.FabricAndCare,
            ShippingAndReturns = dto.Meta?.ShippingAndReturns,
            SizeChartUrl = dto.Meta?.SizeChartUrl,
            Tier = dto.Tier,
            Tags = dto.Tags,
            SortOrder = dto.SortOrder,
            BundleSize = dto.BundleSize,
            SubCategoryId = await ValidateSubCategoryId(dto.SubCategoryId, category.Id),
            CollectionId = await ValidateCollectionId(dto.CollectionId, dto.SubCategoryId),
            ProductType = dto.ProductType,
            ProductGroupId = dto.ProductGroupId
        };

        _unitOfWork.Repository<Product>().Add(product);
        
        if (dto.Media?.MainImage != null)
        {
            product.Images.Add(new ProductImage {
                Url = dto.Media.MainImage.ImageUrl ?? string.Empty,
                AltText = dto.Media.MainImage.Alt,
                Label = dto.Media.MainImage.Label,
                MediaType = dto.Media.MainImage.Type ?? "image",
                IsMain = true
            });
        }

        foreach (var thumb in dto.Media?.Thumbnails ?? new())
        {
            product.Images.Add(new ProductImage {
                Url = thumb.ImageUrl ?? string.Empty,
                AltText = thumb.Alt,
                Label = thumb.Label,
                MediaType = thumb.Type ?? "image",
                IsMain = false
            });
        }
        if (dto.InventoryVariants != null)
        {
            foreach (var v in dto.InventoryVariants)
            {
                product.Variants.Add(new ProductVariant {
                    Sku = v.Sku,
                    Price = v.SalePrice ?? v.Price,
                    CompareAtPrice = v.SalePrice.HasValue ? v.Price : null,
                    PurchaseRate = v.PurchaseRate,
                    StockQuantity = v.Inventory,
                    Size = v.Label
                });
            }
        }

        if (dto.ProductType == ProductType.Combo && dto.ComboItems != null)
        {
            foreach (var ci in dto.ComboItems)
            {
                product.ComboItems.Add(new ComboItem
                {
                    ProductId = ci.ProductId,
                    ProductVariantId = ci.ProductVariantId,
                    Quantity = ci.Quantity
                });
            }
        }

        var result = await _unitOfWork.Complete();
        if (result <= 0) return null!;

        var full = await _db.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .FirstAsync(p => p.Id == product.Id);

        _cache.Products[full.Id] = full;
        RebuildHomePageCache();

        return _mapper.Map<ProductDto>(full);
    }

    public async Task<ProductDto?> UpdateProductAsync(int id, ProductUpdateDto dto, bool ignoreFilters = false)
    {
        var spec = new ProductsWithCategoriesSpecification(id);
        var product = ignoreFilters
            ? await _unitOfWork.Repository<Product>().GetEntityWithSpecIgnoreFiltersAsync(spec, track: true)
            : await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec, track: true);

        if (product == null) throw new KeyNotFoundException("Product not found");

        var oldSlug = product.Slug;
        int.TryParse(dto.Category, out int catId);
        var category = await _unitOfWork.Repository<Category>().GetQueryable()
            .FirstOrDefaultAsync(c => c.Name.ToLower() == dto.Category.ToLower() || (catId != 0 && c.Id == catId));
        
        if (category == null) throw new KeyNotFoundException($"Category {dto.Category} not found");

        product.Name = dto.Name;
        product.Description = dto.Description;
        product.ShortDescription = dto.ShortDescription;
        product.IsActive = dto.StatusActive;
        product.CategoryId = category.Id;
        product.ImageUrl = dto.Media?.MainImage?.ImageUrl ?? string.Empty;
        product.IsNew = dto.NewArrival;
        product.IsFeatured = dto.IsFeatured;
        product.FabricAndCare = dto.Meta?.FabricAndCare;
        product.ShippingAndReturns = dto.Meta?.ShippingAndReturns;
        product.SizeChartUrl = dto.Meta?.SizeChartUrl;
        product.Tier = dto.Tier;
        product.Tags = dto.Tags;
        product.SortOrder = dto.SortOrder;
        product.BundleSize = dto.BundleSize;
        product.SubCategoryId = await ValidateSubCategoryId(dto.SubCategoryId, category.Id);
        product.CollectionId = await ValidateCollectionId(dto.CollectionId, dto.SubCategoryId);
        product.ProductType = dto.ProductType;
        product.ProductGroupId = dto.ProductGroupId;

        // Sync images
        foreach (var img in product.Images.ToList()) _unitOfWork.Repository<ProductImage>().Delete(img);
        if (dto.Media?.MainImage != null)
        {
            product.Images.Add(new ProductImage {
                Url = dto.Media.MainImage.ImageUrl ?? string.Empty,
                AltText = dto.Media.MainImage.Alt,
                Label = dto.Media.MainImage.Label,
                MediaType = dto.Media.MainImage.Type ?? "image",
                IsMain = true
            });
        }
        foreach (var thumb in dto.Media?.Thumbnails ?? new())
        {
            product.Images.Add(new ProductImage {
                Url = thumb.ImageUrl ?? string.Empty,
                AltText = thumb.Alt,
                Label = thumb.Label,
                MediaType = thumb.Type ?? "image",
                IsMain = false
            });
        }

        // Sync variants
        var existingVariants = product.Variants.ToList();
        var incomingVariants = dto.InventoryVariants;

        // 1. Mark for deletion those not in incoming list
        foreach (var existing in existingVariants)
        {
            if (!incomingVariants.Any(iv => iv.Id == existing.Id))
            {
                _unitOfWork.Repository<ProductVariant>().Delete(existing);
            }
        }

        // 2. Add or Update
        foreach (var iv in incomingVariants)
        {
            if (iv.Id.HasValue && iv.Id > 0)
            {
                // Update existing
                var existing = existingVariants.FirstOrDefault(v => v.Id == iv.Id);
                if (existing != null)
                {
                    existing.Sku = iv.Sku;
                    existing.Price = iv.SalePrice ?? iv.Price;
                    existing.CompareAtPrice = iv.SalePrice.HasValue ? iv.Price : null;
                    existing.PurchaseRate = iv.PurchaseRate;
                    existing.StockQuantity = iv.Inventory;
                    existing.Size = iv.Label;
                    _unitOfWork.Repository<ProductVariant>().Update(existing);
                }
            }
            else
            {
                // Add new
                product.Variants.Add(new ProductVariant
                {
                    Sku = iv.Sku,
                    Price = iv.SalePrice ?? iv.Price,
                    CompareAtPrice = iv.SalePrice.HasValue ? iv.Price : null,
                    PurchaseRate = iv.PurchaseRate,
                    StockQuantity = iv.Inventory,
                    Size = iv.Label
                });
            }
        }

        // Sync combo items
        var existingComboItems = product.ComboItems.ToList();
        var incomingComboItems = dto.ComboItems ?? new List<ComboItemDto>();

        // 1. Mark for deletion those not in incoming list
        foreach (var existing in existingComboItems)
        {
            if (!incomingComboItems.Any(ici => ici.Id == existing.Id))
            {
                _unitOfWork.Repository<ComboItem>().Delete(existing);
            }
        }

        // 2. Add or Update
        if (dto.ProductType == ProductType.Combo)
        {
            foreach (var ici in incomingComboItems)
            {
                if (ici.Id.HasValue && ici.Id > 0)
                {
                    // Update existing
                    var existing = existingComboItems.FirstOrDefault(ci => ci.Id == ici.Id);
                    if (existing != null)
                    {
                        existing.ProductId = ici.ProductId;
                        existing.ProductVariantId = ici.ProductVariantId;
                        existing.Quantity = ici.Quantity;
                        _unitOfWork.Repository<ComboItem>().Update(existing);
                    }
                }
                else
                {
                    // Add new
                    product.ComboItems.Add(new ComboItem
                    {
                        ProductId = ici.ProductId,
                        ProductVariantId = ici.ProductVariantId,
                        Quantity = ici.Quantity
                    });
                }
            }
        }

        product.StockQuantity = dto.InventoryVariants.Sum(v => v.Inventory);

        _unitOfWork.Repository<Product>().Update(product);
        await _unitOfWork.Complete();

        var full = await _db.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .FirstAsync(p => p.Id == product.Id);

        _cache.Products[full.Id] = full;
        RebuildHomePageCache();

        return _mapper.Map<ProductDto>(full);
    }

    private void RebuildHomePageCache()
    {
        var homeDto = new HomePageDto
        {
            Banners = _mapper.Map<List<HeroBannerDto>>(
                _cache.Banners.Values.OrderBy(b => b.DisplayOrder).ToList()),
            Categories = _mapper.Map<List<CategoryDto>>(
                _cache.Categories.Values.Take(10).ToList()),
            FeaturedProducts = _mapper.Map<List<ProductListDto>>(
                _cache.Products.Values
                    .Where(p => p.IsFeatured && p.IsActive)
                    .Take(12).ToList()),
            NewArrivals = _mapper.Map<List<ProductListDto>>(
                _cache.Products.Values
                    .Where(p => p.IsActive)
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(12).ToList())
        };
        _cache.HomePageData["homepage"] = homeDto;
    }

    public async Task UpdateProductGroupAsync(int groupId)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var group = await db.ProductGroups
            .AsNoTracking()
            .Include(g => g.Products)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        
        if (group != null) _cache.ProductGroups[groupId] = group;
        else _cache.ProductGroups.TryRemove(groupId, out _);
        RebuildHomePageCache();
    }

    public async Task<List<ProductSearchResultDto>> SearchProductsForComboAsync(string? q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return new List<ProductSearchResultDto>();

        var searchTerm = q.Trim().ToLower();

        var products = _cache.Products.Values
            .Where(p => p.Name.ToLower().Contains(searchTerm)
                     || (p.Sku != null && p.Sku.ToLower().Contains(searchTerm)))
            .OrderByDescending(p => p.CreatedAt)
            .Take(15)
            .ToList();

        return products.Select(p => new ProductSearchResultDto
        {
            Id = p.Id,
            Name = p.Name,
            ImageUrl = p.ImageUrl,
            Sku = p.Sku,
            Price = p.Variants.Any(v => v.Price > 0)
                ? p.Variants.Where(v => v.Price > 0).Min(v => v.Price) ?? 0
                : 0,
            Variants = p.Variants.Select(v => new ProductSearchVariantDto
            {
                Id = v.Id,
                Size = v.Size,
                StockQuantity = v.StockQuantity,
                Price = v.Price ?? 0
            }).ToList()
        }).ToList();
    }

    public Task<List<ProductCatalogItemDto>> GetProductCatalogAsync()
    {
        var products = _cache.Products.Values
            .OrderByDescending(p => p.CreatedAt)
            .ToList();

        var dtos = products.Select(p => new ProductCatalogItemDto
        {
            Id = p.Id,
            Name = p.Name,
            Sku = p.Sku,
            ImageUrl = p.ImageUrl,
            Price = p.Variants.Any() ? p.Variants.Min(v => v.Price) ?? 0 : 0,
            IsActive = p.IsActive,
            Status = p.IsActive ? "Active" : "Draft",
            StockQuantity = p.Variants.Any() ? p.Variants.Sum(v => v.StockQuantity) : p.StockQuantity,
            Slug = p.Slug
        }).ToList();

        return Task.FromResult(dtos);
    }

    public Task<List<string>> GetAvailableSizesAsync()
    {
        var sizes = _cache.Products.Values
            .SelectMany(p => p.Variants)
            .Where(v => !string.IsNullOrEmpty(v.Size))
            .Select(v => v.Size!)
            .Distinct()
            .ToList();

        var sizeOrder = new List<string> { 
            "2", "4", "6", "8", "10", "12", "14", "16",
            "28", "30", "32", "34", "36", "38", "40", "42", "44",
            "xs", "s", "m", "l", "xl", "xxl", "2xl", "xxxl", "3xl", "4xl", "5xl" 
        };

        var ordered = sizes.OrderBy(s => {
            var index = sizeOrder.IndexOf(s.ToLower());
            return index == -1 ? 999 : index;
        }).ThenBy(s => s).ToList();

        return Task.FromResult(ordered);
    }

    private async Task<int?> ValidateSubCategoryId(int? subCatId, int catId)
    {
        if (subCatId == null || subCatId <= 0) return null;
        var exists = await _unitOfWork.Repository<SubCategory>().GetQueryable()
            .AnyAsync(sc => sc.Id == subCatId && sc.CategoryId == catId);
        return exists ? subCatId : null;
    }

    private async Task<int?> ValidateCollectionId(int? collectionId, int? subCatId)
    {
        if (collectionId == null || collectionId <= 0) return null;
        var exists = await _unitOfWork.Repository<Collection>().GetQueryable()
            .AnyAsync(c => c.Id == collectionId && (subCatId == null || c.SubCategoryId == subCatId));
        return exists ? collectionId : null;
    }

    private async Task<string> GenerateUniqueSlugAsync(string name)
    {
        var baseSlug = GenerateSlug(name);
        var slug = baseSlug;
        int counter = 1;

        while (await _unitOfWork.Repository<Product>().GetQueryable().AnyAsync(p => p.Slug == slug))
        {
            var randomSuffix = Guid.NewGuid().ToString().Substring(0, 4);
            slug = $"{baseSlug}-{randomSuffix}";
            
            if (counter++ > 10) break; 
        }

        return slug;
    }

    private string GenerateSlug(string name)
    {
        if (string.IsNullOrEmpty(name)) return Guid.NewGuid().ToString().Substring(0, 8);
        
        var slug = name.ToLower().Trim();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-").Trim('-');
        
        if (slug.Length > 150) slug = slug.Substring(0, 150).Trim('-');
        
        return string.IsNullOrEmpty(slug) ? Guid.NewGuid().ToString().Substring(0, 8) : slug;
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.Enums;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace ECommerce.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IDistributedCache _cache;

    public ProductService(IUnitOfWork unitOfWork, IMapper mapper, IDistributedCache cache)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<ProductDto?> GetProductBySlugAsync(string slug)
    {
        var cacheKey = $"product_slug:{slug}";
        var cached = await _cache.GetStringAsync(cacheKey);
        if (cached != null) return JsonSerializer.Deserialize<ProductDto>(cached);

        var spec = new ProductsWithCategoriesSpecification(slug);
        var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec<ProductDto>(spec);

        if (product != null)
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(product), new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
            });
        }

        return product;
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id)
    {
        var cacheKey = $"product_id:{id}";
        var cached = await _cache.GetStringAsync(cacheKey);
        if (cached != null) return JsonSerializer.Deserialize<ProductDto>(cached);

        var spec = new ProductsWithCategoriesSpecification(id);
        var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec<ProductDto>(spec);

        if (product != null)
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(product), new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
            });
        }

        return product;
    }


    public async Task<ProductDto?> CreateProductAsync(ProductCreateDto dto)
    {
        var categorySpec = new CategoriesWithSubCategoriesSpec(dto.Category);
        var category = await _unitOfWork.Repository<Category>().GetEntityWithSpec(categorySpec);
        
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
            Slug = GenerateSlug(dto.Name),
            Sku = $"PRD-{DateTime.UtcNow.Ticks}",
            FabricAndCare = dto.Meta?.FabricAndCare,
            ShippingAndReturns = dto.Meta?.ShippingAndReturns,

            // New fields
            Tier = dto.Tier,
            Tags = dto.Tags,
            SortOrder = dto.SortOrder,
            SubCategoryId = dto.SubCategoryId,
            CollectionId = dto.CollectionId,
            ProductType = dto.ProductType,
            IsBundle = dto.IsBundle,
            BundleQuantity = dto.BundleQuantity > 0 ? dto.BundleQuantity : 1
        };

        _unitOfWork.Repository<Product>().Add(product);
        
        
        // Handle Images
        if (dto.Media?.MainImage != null)
        {
            product.Images.Add(new ProductImage {
                Url = dto.Media.MainImage.ImageUrl ?? string.Empty,
                AltText = dto.Media.MainImage.Alt,
                Label = dto.Media.MainImage.Label,
                MediaType = dto.Media.MainImage.Type ?? "image",
                IsMain = true,
                Color = dto.Media.MainImage.Color
            });
        }

        foreach (var thumb in dto.Media?.Thumbnails ?? new())
        {
            product.Images.Add(new ProductImage {
                Url = thumb.ImageUrl ?? string.Empty,
                AltText = thumb.Alt,
                Label = thumb.Label,
                MediaType = thumb.Type ?? "image",
                IsMain = false,
                Color = thumb.Color
            });
        }

        // Handle Variants — each variant = one size with its own stock
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

        var result = await _unitOfWork.Complete();
        if (result <= 0) return null!;

        return _mapper.Map<Product, ProductDto>(product);
    }

    public async Task<ProductDto?> UpdateProductAsync(int id, ProductUpdateDto dto)
    {
        var spec = new ProductsWithCategoriesSpecification(id);
        var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec); // Fixed: Removed <Product> to use the non-projected tracked version

        if (product == null) throw new KeyNotFoundException("Product not found");

        var categorySpec = new CategoriesWithSubCategoriesSpec(dto.Category);
        var category = await _unitOfWork.Repository<Category>().GetEntityWithSpec<Category>(categorySpec);
        if (category == null) throw new KeyNotFoundException($"Category {dto.Category} not found");

        // Update basic props
        product.Name = dto.Name; // Ensure name is also updated
        product.Description = dto.Description;
        product.ShortDescription = dto.ShortDescription;
        product.IsActive = dto.StatusActive;
        product.CategoryId = category.Id;
        product.ImageUrl = dto.Media?.MainImage?.ImageUrl ?? string.Empty;

        product.IsNew = dto.NewArrival;
        product.IsFeatured = dto.IsFeatured;
        product.FabricAndCare = dto.Meta?.FabricAndCare;
        product.ShippingAndReturns = dto.Meta?.ShippingAndReturns;

        // New fields
        product.Tier = dto.Tier;
        product.Tags = dto.Tags;
        product.SortOrder = dto.SortOrder;
        product.SubCategoryId = dto.SubCategoryId;
        product.CollectionId = dto.CollectionId;
        product.ProductType = dto.ProductType;
        product.IsBundle = dto.IsBundle;
        product.BundleQuantity = dto.BundleQuantity > 0 ? dto.BundleQuantity : 1;


        // Sync images
        foreach (var img in product.Images.ToList())
        {
            _unitOfWork.Repository<ProductImage>().Delete(img);
        }

        if (dto.Media?.MainImage != null)
        {
            product.Images.Add(new ProductImage {
                Url = dto.Media.MainImage.ImageUrl ?? string.Empty,
                AltText = dto.Media.MainImage.Alt,
                Label = dto.Media.MainImage.Label,
                MediaType = dto.Media.MainImage.Type ?? "image",
                IsMain = true,
                Color = dto.Media.MainImage.Color
            });
        }

        foreach (var thumb in dto.Media?.Thumbnails ?? new())
        {
            product.Images.Add(new ProductImage {
                Url = thumb.ImageUrl ?? string.Empty,
                AltText = thumb.Alt,
                Label = thumb.Label,
                MediaType = thumb.Type ?? "image",
                IsMain = false,
                Color = thumb.Color
            });
        }

        // Sync variants
        foreach (var v in product.Variants.ToList())
        {
            _unitOfWork.Repository<ProductVariant>().Delete(v);
        }
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

        // Recalculate total stock from variants
        product.StockQuantity = dto.InventoryVariants.Sum(v => v.Inventory);

        _unitOfWork.Repository<Product>().Update(product);
        var savedChanges = await _unitOfWork.Complete();
        Console.WriteLine($"[SERVICE_DEBUG] Saved {savedChanges} changes to database for Product {id}");

        // Invalidate cache
        var cacheKeys = new[] { $"product_id:{id}", $"product_slug:{product.Slug}" };
        foreach (var key in cacheKeys)
        {
            await _cache.RemoveAsync(key);
        }

        // Also invalidate IMemoryCache if possible, but ProductService only has IDistributedCache.
        // The controller handles IMemoryCache removal for "home_page_data".

        return _mapper.Map<Product, ProductDto>(product);
    }

    private string GenerateSlug(string name)
    {
        if (string.IsNullOrEmpty(name)) return Guid.NewGuid().ToString();

        var slug = name.ToLower().Trim()
            .Replace(" ", "-")
            .Replace("/", "-")
            .Replace("&", "and")
            .Replace("?", "")
            .Replace("!", "")
            .Replace(".", "")
            .Replace(",", "")
            .Replace("'", "")
            .Replace("\"", "");
        
        // Ensure slug isn't too long or empty
        if (slug.Length > 100) slug = slug.Substring(0, 100);
        
        return slug;
    }

    public async Task<List<string>> GetAvailableSizesAsync()
    {
        var sizes = await _unitOfWork.Repository<ProductVariant>()
            .GetQueryable()
            .Where(v => !string.IsNullOrEmpty(v.Size))
            .Select(v => v.Size!)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync();
        
        return sizes;
    }


}

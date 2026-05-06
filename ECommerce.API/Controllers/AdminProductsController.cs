using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Entities;
using ECommerce.Core.Specifications;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Constants;
using ECommerce.API.Helpers;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IProductService _productService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _config;
    private readonly ICacheService _cache;
    private readonly IOutputCacheStore _cacheStore;

    public AdminProductsController(ApplicationDbContext context, IWebHostEnvironment environment, IProductService productService, IUnitOfWork unitOfWork, IConfiguration config, ICacheService cache, IOutputCacheStore cacheStore)
    {
        _context = context;
        _environment = environment;
        _productService = productService;
        _unitOfWork = unitOfWork;
        _config = config;
        _cache = cache;
        _cacheStore = cacheStore;
    }

    [HttpPost("upload-media")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<ActionResult<List<string>>> UploadProductMedia([FromForm] List<IFormFile> files)
    {
        try 
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded");

            var uploadedUrls = new List<string>();
            var uploadsFolder = PathHelper.GetUploadsFolder(_config, _environment, "products");

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    var fileExtension = Path.GetExtension(file.FileName);
                    var fileName = $"{Guid.NewGuid()}{fileExtension}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    uploadedUrls.Add($"/uploads/products/{fileName}");
                }
            }

            return Ok(uploadedUrls);
        }
        catch (UnauthorizedAccessException ex)
        {
             return StatusCode(403, new { message = "Permission denied: The server process does not have write access to the products folder. Error: " + ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during product media upload: " + ex.Message });
        }
    }

    /// <summary>
    /// Lightweight product search for combo bundle selection.
    /// Returns minimal product data with variant info.
    /// GET /api/admin/products/search?q=term
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<object>> SearchProductsForCombo([FromQuery] string? q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(Array.Empty<object>());

        var searchTerm = q.Trim().ToLower();

        var products = await _context.Products
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(p => p.Name.ToLower().Contains(searchTerm) 
                     || (p.Sku != null && p.Sku.ToLower().Contains(searchTerm)))
            .Include(p => p.Variants)
            .OrderByDescending(p => p.CreatedAt)
            .Take(15)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.ImageUrl,
                p.Sku,
                Price = p.Variants.Any(v => v.Price > 0) 
                    ? p.Variants.Where(v => v.Price > 0).Min(v => v.Price) 
                    : 0,
                Variants = p.Variants.Select(v => new
                {
                    v.Id,
                    v.Size,
                    v.StockQuantity,
                    v.Price
                }).ToList()
            })
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("available-sizes")]
    public async Task<ActionResult<List<string>>> GetAvailableSizes()
    {
        var sizes = await _productService.GetAvailableSizesAsync();
        return Ok(sizes);
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetProducts(
        [FromQuery] string? searchTerm,
        [FromQuery] string? category,
        [FromQuery] string? statusTab,
        [FromQuery] string? stockStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Products
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(p => p.Name.Contains(searchTerm) || p.Sku.Contains(searchTerm));
        }

        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            var dbCat = await _context.Categories.FirstOrDefaultAsync(c => c.Name.ToLower() == category.ToLower());
            if (dbCat != null)
            {
                query = query.Where(p => p.CategoryId == dbCat.Id);
            }
        }

        if (!string.IsNullOrEmpty(statusTab) && statusTab != "all")
        {
            bool isActive = statusTab.ToLower() == "active";
            query = query.Where(p => p.IsActive == isActive);
        }

        if (!string.IsNullOrEmpty(stockStatus) && stockStatus != "all")
        {
            if (stockStatus.ToLower() == "instock")
            {
                query = query.Where(p => p.StockQuantity > 0);
            }
            else if (stockStatus.ToLower() == "outofstock")
            {
                query = query.Where(p => p.StockQuantity <= 0);
            }
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

        var products = rawProducts.Select(p => new
        {
            p.Id,
            p.Name,
            p.Description,
            p.ShortDescription,
            p.Sku,
            Price = p.Variants.FirstOrDefault()?.Price ?? 0,
            SalePrice = p.Variants.FirstOrDefault()?.CompareAtPrice,
            PurchaseRate = p.Variants.FirstOrDefault()?.PurchaseRate,
            StockQuantity = p.Variants.Any() ? p.Variants.Sum(v => v.StockQuantity) : p.StockQuantity,
            p.IsNew,
            p.IsFeatured,
            Status = p.IsActive ? "Active" : "Draft",
            p.ImageUrl,
            Category = p.Category?.Name ?? "",
            SubCategory = p.SubCategory?.Name ?? "",
            CategoryId = p.CategoryId,
            MediaUrls = p.Images.Select(i => i.Url).ToList(),
            Images = p.Images.Select(i => new { i.Url }).ToList(),
            Variants = p.Variants.Select(v => new { v.Id, v.Size, v.StockQuantity, v.Price }).ToList(),
            p.Tier,
            p.Tags,
            p.SortOrder,
            p.CreatedAt,
            p.Slug
        }).ToList();

        return Ok(new { items = products, total });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProductById(int id)
    {
        var product = await _productService.GetProductByIdAsync(id, ignoreFilters: true);

        if (product == null) return NotFound();

        return Ok(product);
    }

    private static readonly System.Text.Json.JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
    };

    private ProductVariantsDto DeserializeVariantsDto(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new ProductVariantsDto();
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<ProductVariantsDto>(json, _jsonOptions) ?? new ProductVariantsDto();
        }
        catch
        {
            return new ProductVariantsDto();
        }
    }

    private ProductMetaDto DeserializeMetaDto(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new ProductMetaDto();
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<ProductMetaDto>(json, _jsonOptions) ?? new ProductMetaDto();
        }
        catch
        {
            return new ProductMetaDto();
        }
    }

    [HttpPost]
    public async Task<ActionResult> CreateProduct([FromBody] ProductCreateDto dto)
    {
        try
        {
            var result = await _productService.CreateProductAsync(dto);
            if (result == null) return BadRequest(new { message = "Error creating product" });

            await _cache.RemoveAsync("home_new_arrivals");
            await _cache.RemoveAsync("home_featured_products");
            await _cacheStore.EvictByTagAsync("catalog", default);

            return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException != null ? $". Inner: {ex.InnerException.Message}" : "";
            Console.WriteLine($"[ADMIN_ERROR] Error creating product: {ex.Message}{innerMsg}");
            return StatusCode(500, new { message = $"Error creating product: {ex.Message}{innerMsg}" });
        }
    }

    [HttpPost("{id}")]
    public async Task<ActionResult> UpdateProduct(int id, [FromBody] ProductUpdateDto dto)
    {
        try
        {
            Console.WriteLine($"[ADMIN_DEBUG] Updating Product {id}: {dto.Name}, Type: {dto.ProductType}");
            var result = await _productService.UpdateProductAsync(id, dto, ignoreFilters: true);
            if (result == null) return BadRequest(new { message = "Error updating product" });

            await _cache.RemoveAsync("home_new_arrivals");
            await _cache.RemoveAsync("home_featured_products");
            await _cacheStore.EvictByTagAsync("catalog", default);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException != null ? $". Inner: {ex.InnerException.Message}" : "";
            Console.WriteLine($"[ADMIN_ERROR] Error updating product: {ex.Message}{innerMsg}");
            return StatusCode(500, new { message = $"Error updating product: {ex.Message}{innerMsg}" });
        }
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("{id:int}/delete")]
    public async Task<ActionResult<bool>> DeleteProduct(int id)
    {
        var product = await _context.Products
            .IgnoreQueryFilters()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound();

        // Delete associated images from filesystem
        if (!string.IsNullOrEmpty(product.ImageUrl))
        {
            DeleteImageFile(product.ImageUrl);
        }

        foreach (var image in product.Images)
        {
            DeleteImageFile(image.Url);
        }

        // Delete associated CLP Config if exists
        var clpConfig = await _context.CustomLandingPageConfigs.FirstOrDefaultAsync(c => c.ProductId == id);
        if (clpConfig != null)
        {
            _context.CustomLandingPageConfigs.Remove(clpConfig);
        }

        try
        {
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DELETE_ERROR] Product {id}: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[DELETE_INNER_ERROR] {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "Cannot delete product. It may be referenced by orders or other data. Error: " + ex.Message });
        }

        await _cache.RemoveAsync("home_new_arrivals");
        await _cache.RemoveAsync("home_featured_products");
        await _cacheStore.EvictByTagAsync("catalog", default);

        return Ok(true);
    }


    private List<object> DeserializeVariants(string? json)
    {
        if (string.IsNullOrEmpty(json))
            return new List<object>();
        
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<object>>(json) ?? new List<object>();
        }
        catch
        {
            return new List<object>();
        }
    }

    private void DeleteImageFile(string imageUrl)
    {
        try
        {
            var fileName = Path.GetFileName(imageUrl);
            var uploadsFolder = PathHelper.GetUploadsFolder(_config, _environment, "products");
            var filePath = Path.Combine(uploadsFolder, fileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }
        catch
        {
            // Log error but don't fail the request
        }
    }

    private static string GenerateSlug(string name)
    {
        return name.ToLower()
            .Replace(" ", "-")
            .Replace("?", "")
            .Replace("!", "")
            .Replace(".", "")
            .Replace(",", "")
            .Replace("'", "")
            .Replace("\"", "");
    }
    [HttpGet("inventory")]
    public async Task<ActionResult<List<ProductInventoryDto>>> GetInventory()
    {
        var spec = new BaseSpecification<Product>();
        spec.AddInclude(x => x.Variants);
        
        // Performance: Use AsNoTracking indirectly via the repository if it supports it, 
        // but here we are using ListAsync(spec).
        var products = await _unitOfWork.Repository<Product>().ListAsync(spec);

        var inventory = products.Select(p => new ProductInventoryDto
        {
            ProductId = p.Id,
            ProductName = p.Name,
            ProductSku = p.Sku ?? string.Empty,
            ProductSlug = p.Slug ?? string.Empty,
            ImageUrl = p.ImageUrl ?? string.Empty,
            TotalStock = p.Variants.Any() ? p.Variants.Sum(v => v.StockQuantity) : p.StockQuantity,
            StockQuantity = p.Variants.Any() ? p.Variants.Sum(v => v.StockQuantity) : p.StockQuantity,
            Price = p.Variants.FirstOrDefault()?.Price,
            CompareAtPrice = p.Variants.FirstOrDefault()?.CompareAtPrice,
            PurchaseRate = p.Variants.FirstOrDefault()?.PurchaseRate,
            Variants = p.Variants.Select(v => new VariantInventoryDto
            {
                VariantId = v.Id,
                Sku = v.Sku ?? string.Empty,
                Size = v.Size ?? string.Empty,
                StockQuantity = v.StockQuantity,
                Price = v.Price,
                CompareAtPrice = v.CompareAtPrice,
                PurchaseRate = v.PurchaseRate
            }).ToList()
        }).ToList();

        return Ok(inventory);
    }

    [HttpPost("inventory/{variantId}")]
    public async Task<ActionResult> UpdateStock(int variantId, UpdateInventoryDto dto)
    {
        var variant = await _unitOfWork.Repository<ProductVariant>().GetByIdAsync(variantId);
        if (variant == null) return NotFound(new { message = "Variant not found" });

        var product = await _unitOfWork.Repository<Product>().GetByIdAsync(variant.ProductId);
        if (product == null) return NotFound(new { message = "Parent product not found" });
        
        // Update variant stock and prices
        variant.StockQuantity = dto.Quantity;
        if (dto.Price.HasValue) variant.Price = dto.Price;
        if (dto.CompareAtPrice.HasValue) variant.CompareAtPrice = dto.CompareAtPrice;
        if (dto.PurchaseRate.HasValue) variant.PurchaseRate = dto.PurchaseRate;

        _unitOfWork.Repository<ProductVariant>().Update(variant);

        // Recalculate total stock for product
        var variantSpec = new BaseSpecification<ProductVariant>(v => v.ProductId == product.Id);
        var allVariants = await _unitOfWork.Repository<ProductVariant>().ListAsync(variantSpec);
        
        var targetVar = allVariants.FirstOrDefault(v => v.Id == variantId);
        if (targetVar != null) targetVar.StockQuantity = dto.Quantity;

        product.StockQuantity = allVariants.Sum(v => v.StockQuantity);
        _unitOfWork.Repository<Product>().Update(product);

        if (await _unitOfWork.Complete() > 0)
        {
             // Invalidate cache
             await _cache.RemoveAsync("home_new_arrivals");
             await _cache.RemoveAsync("home_featured_products");
             await _cacheStore.EvictByTagAsync("catalog", default);
             
             var cacheKeys = new[] { $"product_id:{product.Id}", $"product_slug:{product.Slug}" };
             foreach (var key in cacheKeys)
             {
                 await _cache.RemoveAsync(key);
             }

             return Ok(new { message = "Stock updated successfully", newTotal = product.StockQuantity });
        }

        return BadRequest(new { message = "Failed to update stock" });
    }

    [HttpPost("inventory/product/{productId}")]
    public async Task<ActionResult> UpdateProductStock(int productId, UpdateInventoryDto dto)
    {
        var product = await _unitOfWork.Repository<Product>().GetByIdAsync(productId);
        if (product == null) return NotFound(new { message = "Product not found" });

        var spec = new BaseSpecification<ProductVariant>(v => v.ProductId == productId);
        var variants = await _unitOfWork.Repository<ProductVariant>().ListAsync(spec);

        // Update main product stock only if no variants exist, 
        // otherwise it MUST be the sum of variants to avoid drift.
        if (variants.Any())
        {
            product.StockQuantity = variants.Sum(v => v.StockQuantity);
        }
        else 
        {
            product.StockQuantity = dto.Quantity;
        }
        
        foreach (var v in variants)
        {
            if (dto.Price.HasValue) v.Price = dto.Price;
            if (dto.CompareAtPrice.HasValue) v.CompareAtPrice = dto.CompareAtPrice;
            if (dto.PurchaseRate.HasValue) v.PurchaseRate = dto.PurchaseRate;
            _unitOfWork.Repository<ProductVariant>().Update(v);
        }

        _unitOfWork.Repository<Product>().Update(product);

        if (await _unitOfWork.Complete() > 0)
        {
            await _cache.RemoveAsync("home_new_arrivals");
            await _cache.RemoveAsync("home_featured_products");
            await _cacheStore.EvictByTagAsync("catalog", default);
            await _cache.RemoveAsync($"product_id:{product.Id}");
            await _cache.RemoveAsync($"product_slug:{product.Slug}");

            return Ok(new { message = "Stock updated successfully", newTotal = product.StockQuantity });
        }

        return BadRequest(new { message = "Failed to update stock" });
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("inventory/sync-all")]
    public async Task<ActionResult> SyncAllInventory()
    {
        var products = await _context.Products.Include(p => p.Variants).ToListAsync();
        int fixedCount = 0;

        foreach (var product in products)
        {
            if (product.Variants.Any())
            {
                int correctStock = product.Variants.Sum(v => v.StockQuantity);
                if (product.StockQuantity != correctStock)
                {
                    product.StockQuantity = correctStock;
                    fixedCount++;
                }
            }
        }

        if (fixedCount > 0)
        {
            await _context.SaveChangesAsync();
            await _cacheStore.EvictByTagAsync("catalog", default);
            return Ok(new { message = $"Synchronized {fixedCount} products successfully." });
        }

        return Ok(new { message = "All products are already synchronized." });
    }
}

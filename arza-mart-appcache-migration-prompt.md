# ARZA MART — IN-MEMORY APPCACHE MIGRATION
## MANDATORY MULTI-AGENT ORCHESTRATION MODE

---

## PROJECT CONTEXT

| Field | Value |
|---|---|
| **Project** | Arza Mart E-Commerce Platform |
| **Backend** | ASP.NET Core 8, C#, EF Core, SQL Server |
| **Frontend** | Angular 18 |
| **Deployment** | Windows Shared Hosting (IIS) — Redis not available |
| **Goal** | Remove all fragmented caching mechanisms and replace with a single unified Singleton AppCache |

**Current caching mechanisms to eliminate:**
`ICacheService` · `IMemoryCache` · `IOutputCacheStore` · `[OutputCache]` · `[ResponseCache]` · Angular HTTP cache interceptors

**Target architecture:**
Single `AppCache` class — Singleton, `ConcurrentDictionary`, thread-safe, O(1) lookup, warmed at startup via `CacheWarmupService`.

---

## ⚠️ MANDATORY PRE-ANALYSIS — COMPLETE BEFORE ANY FILE MODIFICATION

All agents must read and document answers to the following before writing a single line of code:

1. Does the full Product dataset (with Images, Variants, Category) fit into available IIS worker process RAM?
2. Is `HomePageDto` rebuild cost acceptable on every product/banner/category change?
3. Are `Categories` duplicated in memory (once in `Categories` dict, once nested inside `Products`)?
4. Are `ProductGroups` creating redundant object graphs that reference full `Product` entities?
5. Are EF navigation properties causing memory bloat when cached as full entities?
6. Are there circular reference risks when caching EF entities directly?
7. Would DTO projections be more memory-efficient than caching raw entities?
8. Is `ConcurrentDictionary` the optimal structure for every cache partition, or should some use immutable snapshots?
9. Are there hidden cache layers not listed in this prompt (e.g., EF query cache, HTTP client cache)?
10. Does `VisitorTrackingMiddleware` have any state that must survive cache migration?

**Document all findings in `cache-audit-report.md` before proceeding.**

---

## AGENT ROSTER

### AGENT 1 — Solution Auditor

**Scan targets:**
```
ECommerce.Core/Interfaces/ICacheService.cs
ECommerce.Infrastructure/Services/CacheService.cs
ECommerce.Core/DTOs/CacheDtos.cs
ECommerce.API/Controllers/AdminCacheController.cs
ECommerce.API/Middleware/VisitorTrackingMiddleware.cs
ECommerce.API/Extensions/ServiceExtensions.cs
ECommerce.API/Program.cs
ECommerce.API/appsettings.json
ECommerce.API/appsettings.Production.json
ECommarce.View/src/app/core/interceptors/cache.interceptor.ts
ECommarce.View/src/app/core/interceptors/admin-cache.interceptor.ts
ECommarce.View/src/app/admin/utils/cache.utils.ts
ECommarce.View/src/app/app.config.ts
```
**Plus:** full grep for `IMemoryCache`, `IOutputCacheStore`, `[OutputCache]`, `[ResponseCache]`, `ICacheService`, `EvictByTagAsync`, `GetOrCreate`, `cacheInterceptor`, `adminCacheInterceptor`.

**Responsibilities:**
- Build a complete dependency graph of all cache-related code
- Identify dead cache code, anti-patterns, and hidden implementations
- Answer all 10 Pre-Analysis questions
- Flag any cross-cutting concerns that affect migration order

**Output:** `cache-audit-report.md`

---

### AGENT 2 — Backend Cache Refactor Engineer

**Files to DELETE entirely:**
```
ECommerce.Core/Interfaces/ICacheService.cs
ECommerce.Infrastructure/Services/CacheService.cs
ECommerce.Core/DTOs/CacheDtos.cs
ECommerce.API/Controllers/AdminCacheController.cs
```

**Files to CLEAN (remove cache attributes and injections):**
```
ECommerce.API/Controllers/ProductsController.cs
ECommerce.API/Controllers/HomeController.cs
ECommerce.API/Controllers/BannersController.cs
ECommerce.API/Controllers/CategoriesController.cs
ECommerce.API/Controllers/NavigationController.cs
ECommerce.API/Controllers/SiteSettingsController.cs
ECommerce.API/Controllers/AdminBannersController.cs
ECommerce.API/Controllers/AdminCategoryController.cs
ECommerce.API/Controllers/AdminSubCategoryController.cs
ECommerce.API/Controllers/AdminProductsController.cs
ECommerce.API/Controllers/AdminSettingsController.cs
ECommerce.API/Controllers/AdminNavigationController.cs
ECommerce.API/Controllers/AdminProductGroupsController.cs
ECommerce.API/Middleware/VisitorTrackingMiddleware.cs
ECommerce.API/Extensions/ServiceExtensions.cs
ECommerce.API/Program.cs
ECommerce.API/appsettings.json
ECommerce.API/appsettings.Production.json
```

**Removal checklist per controller/service:**
- [ ] Remove `[OutputCache]` attributes
- [ ] Remove `[ResponseCache]` attributes
- [ ] Remove `IOutputCacheStore` constructor injection and all `EvictByTagAsync()` calls
- [ ] Remove `IMemoryCache` constructor injection and all `GetOrCreate()`, `Set()`, `Remove()` calls
- [ ] Remove `ICacheService` constructor injection and all usages
- [ ] Remove `services.AddMemoryCache()` from `ServiceExtensions.cs`
- [ ] Remove `services.AddOutputCache(...)` from `ServiceExtensions.cs`
- [ ] Remove `services.AddStackExchangeRedisCache(...)` from `ServiceExtensions.cs`
- [ ] Remove `app.UseOutputCache()` from `Program.cs`
- [ ] Delete Redis connection string section from `appsettings.json` and `appsettings.Production.json`

**Output:** `backend-cache-refactor-report.md`

---

### AGENT 3 — AppCache Architecture Engineer

**Design and implement** `ECommerce.Infrastructure/Cache/AppCache.cs`:

```csharp
using System.Collections.Concurrent;
using ECommerce.Core.Domain.Products;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;

namespace ECommerce.Infrastructure.Cache;

/// <summary>
/// Singleton in-memory cache for all public-facing read data.
/// Thread-safe via ConcurrentDictionary. Populated at startup by CacheWarmupService.
/// Updated in-place on every admin Create/Update/Delete operation.
/// No TTL — data is permanent until explicitly replaced or app restarts.
/// </summary>
public class AppCache
{
    // ─── Products ───────────────────────────────────────────────
    /// Key: Product.Id — includes Images, Variants, Category
    public ConcurrentDictionary<int, Product> Products { get; } = new();

    // ─── Categories ─────────────────────────────────────────────
    /// Key: Category.Id — includes nested SubCategories
    public ConcurrentDictionary<int, Category> Categories { get; } = new();

    /// Key: SubCategory.Id — flat list for O(1) subcategory lookup
    public ConcurrentDictionary<int, SubCategory> SubCategories { get; } = new();

    // ─── Banners ─────────────────────────────────────────────────
    /// Key: HeroBanner.Id — active banners only, ordered by Order
    public ConcurrentDictionary<int, HeroBanner> Banners { get; } = new();

    // ─── Navigation Menu ─────────────────────────────────────────
    /// Key: "main" — single prebuilt MegaMenu tree
    public ConcurrentDictionary<string, List<MegaMenuCategoryDto>> NavigationMenus { get; } = new();

    // ─── Site Settings ────────────────────────────────────────────
    /// Key: "settings" — single entry including DeliveryMethods
    public ConcurrentDictionary<string, SiteSettingsDto> SiteSettings { get; } = new();

    // ─── Product Groups ───────────────────────────────────────────
    /// Key: ProductGroup.Id — active groups with product references
    public ConcurrentDictionary<int, ProductGroup> ProductGroups { get; } = new();

    // ─── HomePage Composite ───────────────────────────────────────
    /// Key: "homepage" — prebuilt HomePageDto, rebuilt on any dependency change
    public ConcurrentDictionary<string, HomePageDto> HomePageData { get; } = new();
}
```

**Architecture decisions to document:**
- Justification for caching entities vs DTOs per partition
- Memory footprint estimate per partition
- Invalidation scope per partition (targeted update vs full rebuild)
- Thread-safety guarantee analysis per operation type

**Output:** `appcache-architecture-report.md`

---

### AGENT 4 — Warmup & Lifecycle Engineer

**Design and implement** `ECommerce.Infrastructure/Cache/CacheWarmupService.cs`:

```csharp
using ECommerce.Core.DTOs;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using AutoMapper;

namespace ECommerce.Infrastructure.Cache;

/// <summary>
/// IHostedService — runs once at app startup.
/// Uses IServiceScopeFactory to safely resolve scoped DbContext from singleton context.
/// </summary>
public class CacheWarmupService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly AppCache _cache;
    private readonly IMapper _mapper;
    private readonly ILogger<CacheWarmupService> _logger;

    public CacheWarmupService(
        IServiceScopeFactory scopeFactory,
        AppCache cache,
        IMapper mapper,
        ILogger<CacheWarmupService> logger)
    {
        _scopeFactory = scopeFactory;
        _cache = cache;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("[AppCache] Warmup starting...");
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await WarmUpProductsAsync(db, cancellationToken);
        await WarmUpCategoriesAsync(db, cancellationToken);
        await WarmUpBannersAsync(db, cancellationToken);
        await WarmUpNavigationAsync(db, cancellationToken);
        await WarmUpSiteSettingsAsync(db, cancellationToken);
        await WarmUpProductGroupsAsync(db, cancellationToken);
        WarmUpHomePage(); // Builds from already-loaded cache data — no extra DB hit

        _logger.LogInformation(
            "[AppCache] Warmup complete. Products={P}, Categories={C}, SubCategories={SC}, Banners={B}, ProductGroups={PG}",
            _cache.Products.Count,
            _cache.Categories.Count,
            _cache.SubCategories.Count,
            _cache.Banners.Count,
            _cache.ProductGroups.Count);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task WarmUpProductsAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var products = await db.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .Include(p => p.Category)
            .ToListAsync(ct);
        foreach (var p in products)
            _cache.Products[p.Id] = p;
    }

    private async Task WarmUpCategoriesAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var categories = await db.Categories
            .AsNoTracking()
            .Include(c => c.SubCategories)
            .ToListAsync(ct);
        foreach (var c in categories) _cache.Categories[c.Id] = c;

        var subCategories = await db.SubCategories.AsNoTracking().ToListAsync(ct);
        foreach (var s in subCategories) _cache.SubCategories[s.Id] = s;
    }

    private async Task WarmUpBannersAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var banners = await db.HeroBanners
            .AsNoTracking()
            .Where(b => b.IsActive)
            .OrderBy(b => b.Order)
            .ToListAsync(ct);
        foreach (var b in banners) _cache.Banners[b.Id] = b;
    }

    private async Task WarmUpNavigationAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var navItems = await db.NavigationMenus
            .AsNoTracking()
            .Include(n => n.Children)
            .OrderBy(n => n.Order)
            .ToListAsync(ct);
        _cache.NavigationMenus["main"] = _mapper.Map<List<MegaMenuCategoryDto>>(navItems);
    }

    private async Task WarmUpSiteSettingsAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var settings = await db.SiteSettings
            .AsNoTracking()
            .Include(s => s.DeliveryMethods)
            .FirstOrDefaultAsync(ct);
        if (settings != null)
            _cache.SiteSettings["settings"] = _mapper.Map<SiteSettingsDto>(settings);
    }

    private async Task WarmUpProductGroupsAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var groups = await db.ProductGroups
            .AsNoTracking()
            .Include(g => g.Products)
            .Where(g => g.IsActive)
            .ToListAsync(ct);
        foreach (var g in groups) _cache.ProductGroups[g.Id] = g;
    }

    public void WarmUpHomePage()
    {
        var homeDto = new HomePageDto
        {
            Banners = _mapper.Map<List<HeroBannerDto>>(
                _cache.Banners.Values.OrderBy(b => b.Order).ToList()),
            Categories = _mapper.Map<List<CategoryDto>>(
                _cache.Categories.Values.Take(10).ToList()),
            FeaturedProducts = _mapper.Map<List<ProductListDto>>(
                _cache.Products.Values
                    .Where(p => p.IsFeatured && p.Status == ProductStatus.Active)
                    .Take(12).ToList()),
            NewArrivals = _mapper.Map<List<ProductListDto>>(
                _cache.Products.Values
                    .Where(p => p.Status == ProductStatus.Active)
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(12).ToList())
        };
        _cache.HomePageData["homepage"] = homeDto;
    }
}
```

**Additional responsibilities:**
- Validate that `CacheWarmupService` is registered before any request-handling middleware runs
- Design startup failure handling (if DB is unavailable at boot)
- Design cache health monitoring endpoint (optional lightweight `/cache/status`)
- Document cache lifecycle: warm → serve → targeted update → serve (no cold paths)

**Output:** `cache-lifecycle-report.md`

---

### AGENT 5 — Product Domain Specialist

**Files to analyze and rewrite:**
```
ECommerce.Core/Interfaces/IProductService.cs
ECommerce.Infrastructure/Services/ProductService.cs
ECommerce.Infrastructure/Services/ProductQueryService.cs
```

**Implementation pattern:**

```csharp
// ─── Constructor ───────────────────────────────────────────────
private readonly AppCache _cache;
private readonly ApplicationDbContext _db;
private readonly IMapper _mapper;
private readonly IServiceScopeFactory _scopeFactory;

// ─── Public Read (zero DB hit) ────────────────────────────────
public Task<PaginationDto<ProductListDto>> GetProductsAsync(ProductsQueryParams q)
{
    var source = _cache.Products.Values
        .Where(p => p.Status == ProductStatus.Active);

    if (!string.IsNullOrWhiteSpace(q.Search))
        source = source.Where(p => p.Name.Contains(q.Search, StringComparison.OrdinalIgnoreCase));

    if (q.CategoryId.HasValue)
        source = source.Where(p => p.CategoryId == q.CategoryId);

    var total = source.Count();
    var items = source
        .Skip((q.PageNumber - 1) * q.PageSize)
        .Take(q.PageSize)
        .ToList();

    return Task.FromResult(new PaginationDto<ProductListDto>
    {
        Items = _mapper.Map<List<ProductListDto>>(items),
        TotalCount = total,
        PageNumber = q.PageNumber,
        PageSize = q.PageSize
    });
}

public Task<ProductDto?> GetProductByIdAsync(int id)
{
    _cache.Products.TryGetValue(id, out var product);
    return Task.FromResult(product == null ? null : _mapper.Map<ProductDto>(product));
}

// ─── Admin Write (DB + targeted cache update) ─────────────────
public async Task<ProductDto> CreateProductAsync(ProductCreateDto dto)
{
    var product = _mapper.Map<Product>(dto);
    _db.Products.Add(product);
    await _db.SaveChangesAsync();

    // Reload with full includes to ensure cache has complete object graph
    var full = await _db.Products
        .AsNoTracking()
        .Include(p => p.Images)
        .Include(p => p.Variants)
        .Include(p => p.Category)
        .FirstAsync(p => p.Id == product.Id);

    _cache.Products[full.Id] = full;
    RebuildHomePageCache();
    return _mapper.Map<ProductDto>(full);
}

public async Task<ProductDto?> UpdateProductAsync(int id, ProductUpdateDto dto)
{
    // ... existing update logic ...
    await _db.SaveChangesAsync();

    var updated = await _db.Products
        .AsNoTracking()
        .Include(p => p.Images)
        .Include(p => p.Variants)
        .Include(p => p.Category)
        .FirstAsync(p => p.Id == id);

    _cache.Products[id] = updated;
    RebuildHomePageCache();
    return _mapper.Map<ProductDto>(updated);
}

public async Task<bool> DeleteProductAsync(int id)
{
    // ... existing delete logic ...
    await _db.SaveChangesAsync();
    _cache.Products.TryRemove(id, out _);
    RebuildHomePageCache();
    return true;
}

// ─── ProductGroup synchronization ─────────────────────────────
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

private void RebuildHomePageCache()
{
    var homeDto = new HomePageDto
    {
        Banners = _mapper.Map<List<HeroBannerDto>>(
            _cache.Banners.Values.OrderBy(b => b.Order).ToList()),
        Categories = _mapper.Map<List<CategoryDto>>(
            _cache.Categories.Values.Take(10).ToList()),
        FeaturedProducts = _mapper.Map<List<ProductListDto>>(
            _cache.Products.Values
                .Where(p => p.IsFeatured && p.Status == ProductStatus.Active)
                .Take(12).ToList()),
        NewArrivals = _mapper.Map<List<ProductListDto>>(
            _cache.Products.Values
                .Where(p => p.Status == ProductStatus.Active)
                .OrderByDescending(p => p.CreatedAt)
                .Take(12).ToList())
    };
    _cache.HomePageData["homepage"] = homeDto;
}
```

**Output:** `product-cache-report.md`

---

### AGENT 6 — Navigation & CMS Specialist

**Files to analyze and rewrite:**
```
ECommerce.Infrastructure/Services/NavigationService.cs
ECommerce.Infrastructure/Services/PublicCategoryService.cs
ECommerce.Infrastructure/Services/PublicSiteSettingsService.cs
ECommerce.Infrastructure/Services/AdminBannerService.cs
ECommerce.Infrastructure/Services/CategoryAdminService.cs
ECommerce.Infrastructure/Services/SubCategoryAdminService.cs
ECommerce.Infrastructure/Services/AdminSettingsService.cs
ECommerce.Infrastructure/Services/AdminNavigationService.cs
```

**Implementation pattern:**

```csharp
// ─── NavigationService ────────────────────────────────────────
public Task<List<MegaMenuCategoryDto>> GetNavigationAsync()
{
    _cache.NavigationMenus.TryGetValue("main", out var nav);
    return Task.FromResult(nav ?? new List<MegaMenuCategoryDto>());
}

private void RebuildNavigationCache()
{
    using var scope = _scopeFactory.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var items = db.NavigationMenus
        .AsNoTracking()
        .Include(n => n.Children)
        .OrderBy(n => n.Order)
        .ToList();
    _cache.NavigationMenus["main"] = _mapper.Map<List<MegaMenuCategoryDto>>(items);
}

// ─── PublicCategoryService ────────────────────────────────────
public Task<List<CategoryDto>> GetCategoriesAsync()
{
    var cats = _cache.Categories.Values.OrderBy(c => c.Order).ToList();
    return Task.FromResult(_mapper.Map<List<CategoryDto>>(cats));
}

// ─── CategoryAdminService / SubCategoryAdminService ──────────
// After every Create/Update/Delete:
private void RebuildCategoryCache()
{
    using var scope = _scopeFactory.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    var cats = db.Categories.AsNoTracking().Include(c => c.SubCategories).ToList();
    _cache.Categories.Clear();
    foreach (var c in cats) _cache.Categories[c.Id] = c;

    var subs = db.SubCategories.AsNoTracking().ToList();
    _cache.SubCategories.Clear();
    foreach (var s in subs) _cache.SubCategories[s.Id] = s;
    // SubCategory changes may affect Homepage category list:
    RebuildHomePageCache();
}

// ─── AdminBannerService ───────────────────────────────────────
// Create:
_cache.Banners[banner.Id] = banner;
RebuildHomePageCache();

// Update:
var updated = await _db.HeroBanners.AsNoTracking().FirstAsync(b => b.Id == id);
_cache.Banners[id] = updated;
RebuildHomePageCache();

// Delete:
_cache.Banners.TryRemove(id, out _);
RebuildHomePageCache();

// ─── AdminSettingsService ─────────────────────────────────────
private void RebuildSettingsCache()
{
    using var scope = _scopeFactory.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var settings = db.SiteSettings
        .AsNoTracking()
        .Include(s => s.DeliveryMethods)
        .FirstOrDefault();
    if (settings != null)
        _cache.SiteSettings["settings"] = _mapper.Map<SiteSettingsDto>(settings);
}
```

**Output:** `cms-cache-report.md`

---

### AGENT 7 — Angular Frontend Refactor Engineer

**Files to DELETE:**
```
ECommarce.View/src/app/core/interceptors/cache.interceptor.ts
ECommarce.View/src/app/core/interceptors/admin-cache.interceptor.ts
ECommarce.View/src/app/admin/utils/cache.utils.ts
```

**Files to MODIFY:**

`app.config.ts` — remove interceptor references:
```typescript
// REMOVE these imports:
// import { cacheInterceptor } from './core/interceptors/cache.interceptor';
// import { adminCacheInterceptor } from './core/interceptors/admin-cache.interceptor';

// REMOVE from withInterceptors([...]):
// cacheInterceptor,
// adminCacheInterceptor,

// KEEP:
provideHttpClient(
  withInterceptors([jwtInterceptor, loadingInterceptor, globalErrorInterceptor])
)
```

**Additional scan required:**
- Find every component/service that imports from `cache.utils.ts` and remove those imports
- Find any component that manually manages HTTP cache headers and remove that logic
- Verify no `HttpRequest` clone with cache headers remains anywhere

**Rationale to document:** Frontend caching is unnecessary because the API layer now responds from in-memory AppCache with sub-millisecond latency. Frontend should always receive fresh data without stale-cache risk.

**Output:** `frontend-cache-refactor-report.md`

---

### AGENT 8 — Performance Engineer

**Estimate and document:**

| Metric | Before | After (Estimated) |
|---|---|---|
| Avg API response time (product list) | ~80–200ms (DB hit) | ~2–5ms (memory) |
| Avg API response time (homepage) | ~150–400ms (multi-query) | ~1–3ms (single dict lookup) |
| DB queries per homepage load | 4–6 queries | 0 |
| DB queries per product list | 2–3 queries | 0 |
| Cold start warmup time | N/A | ~500ms–3s (depends on dataset size) |
| Memory per 1000 products (with includes) | N/A | ~50–150MB (estimate) |
| Memory per full cache (all partitions) | N/A | ~100–300MB (estimate) |
| Concurrent request throughput | Limited by DB pool | Limited by CPU only |

**Additional analysis required:**
- IIS worker process memory limit vs estimated AppCache size
- Application pool recycling impact on cache (warmup re-runs on recycle — is this acceptable?)
- Peak traffic scenarios: can in-memory filtering handle 50/100/500 concurrent product list requests?
- `RebuildHomePageCache()` call frequency analysis — is it called too often?

**Output:** `performance-report.md`

---

### AGENT 9 — QA & Validation Engineer

**Test scenarios to design and validate:**

**Thread Safety:**
- [ ] 100 concurrent GET `/products` — no race conditions
- [ ] Simultaneous admin update + public read on same product
- [ ] `RebuildHomePageCache()` called from two admin operations concurrently

**CRUD Synchronization:**
- [ ] Create product → immediately visible in GET `/products`
- [ ] Update product name → GET `/products/{id}` returns new name
- [ ] Delete product → no longer appears in any listing
- [ ] Update banner → GET `/homepage` reflects new banner
- [ ] Update category → GET `/categories` reflects change
- [ ] Update site settings → GET `/site-settings` returns updated data

**Cache Consistency:**
- [ ] Homepage featured products reflect product status change
- [ ] Homepage new arrivals reflect product creation
- [ ] Category in homepage matches Categories partition
- [ ] No stale entity references between partitions

**Startup Recovery:**
- [ ] App restart → AppCache fully warm before first request served
- [ ] DB temporarily unavailable at startup → graceful failure with clear log message
- [ ] IIS app pool recycle → cache rebuilds correctly

**Compilation:**
- [ ] Zero `ICacheService` references in solution
- [ ] Zero `IMemoryCache` references in solution
- [ ] Zero `IOutputCacheStore` references in solution
- [ ] Zero `[OutputCache]` attributes in solution
- [ ] Zero `[ResponseCache]` attributes in solution
- [ ] Zero `cacheInterceptor` references in Angular project
- [ ] Zero `adminCacheInterceptor` references in Angular project
- [ ] Zero `cache.utils` imports in Angular project
- [ ] `dotnet build` → 0 errors, 0 warnings related to migration
- [ ] `ng build` → 0 errors related to migration

**Output:** `qa-validation-report.md`

---

### AGENT 10 — Migration Coordinator

**Collects outputs from all 9 agents and produces:**

**1. Final Migration Plan** — ordered, conflict-free execution steps

**2. Risk Assessment:**
- Memory risk: AppCache exceeds IIS worker process limit
- Data consistency risk: rebuild method called from wrong scope
- Startup risk: DB unavailable during warmup
- Regression risk: service depends on removed ICacheService

**3. Rollback Plan:**
- Git branch strategy
- Feature flag approach (if needed)
- Steps to revert to ICacheService in < 30 minutes

**4. Deployment Plan:**
- Pre-deployment DB backup
- Deployment window recommendation (low-traffic)
- IIS application pool configuration checks
- Post-deployment smoke test sequence

**5. Testing Checklist** — derived from Agent 9 output

**6. Production Checklist:**
- [ ] `appsettings.Production.json` Redis section removed
- [ ] IIS app pool memory limit verified against AppCache estimate
- [ ] Application pool recycle schedule reviewed
- [ ] First request after deploy returns warm data (not 503)
- [ ] Admin CRUD operations verified live

**Output:** `final-migration-blueprint.md`

---

## PARALLEL EXECUTION SCHEDULE

```
GROUP A (start immediately, no dependencies):
  ├── Agent 1 — Solution Auditor
  └── Agent 8 — Performance Engineer

GROUP B (start after GROUP A completes):
  ├── Agent 2 — Backend Cache Refactor Engineer
  └── Agent 7 — Angular Frontend Refactor Engineer

GROUP C (start after GROUP A completes):
  ├── Agent 5 — Product Domain Specialist
  └── Agent 6 — Navigation & CMS Specialist

GROUP D (start after GROUP A completes):
  ├── Agent 3 — AppCache Architecture Engineer
  └── Agent 4 — Warmup & Lifecycle Engineer

SEQUENTIAL (after ALL groups complete):
  └── Agent 9 — QA & Validation Engineer

FINAL (after Agent 9 completes):
  └── Agent 10 — Migration Coordinator
```

**RULE:** No agent in Groups B, C, or D may modify any file until Agent 1's `cache-audit-report.md` is complete and reviewed.

---

## IMPLEMENTATION RULES — ALL AGENTS MUST FOLLOW

1. **ConcurrentDictionary is inherently thread-safe** — do not add `lock` or `SemaphoreSlim` for basic read/write operations.

2. **Rebuild methods must be synchronous** — `RebuildHomePageCache()`, `RebuildCategoryCache()`, `RebuildNavigationCache()` are sync void methods to avoid async deadlock risk in fire-and-forget context.

3. **AppCache is Singleton** — inject it directly. Never resolve it via `IServiceScopeFactory`.

4. **DbContext is Scoped** — any method in a Singleton service that needs DB access (e.g., rebuild methods) must use `IServiceScopeFactory.CreateScope()`.

5. **Always reload from DB after write for cache update** — do not cache the pre-save entity. Always do `AsNoTracking().Include(...).FirstAsync(x => x.Id == id)` after `SaveChangesAsync()` to ensure the cached object reflects the exact persisted state.

6. **Targeted updates over full clears** — prefer `_cache.Products[id] = updated` over clearing and reloading the entire Products partition. Reserve full-partition rebuild for category/subcategory operations where parent-child relationships must stay consistent.

7. **HomePageDto rebuild triggers:** any change to Products (status/featured flag/new/delete), Banners (create/update/delete/reorder), or Categories (create/delete) must call `RebuildHomePageCache()`.

8. **SubCategory changes must also rebuild Category cache** — `Categories` partition stores nested SubCategories; a subcategory change makes the parent Category stale.

9. **ProductGroup changes must trigger product-group re-link** — if Product entities store `ProductGroupId`, verify affected Products in cache after any ProductGroup update.

10. **Admin cache management endpoint is eliminated** — `AdminCacheController` is deleted. Cache is always consistent automatically. No manual cache invalidation endpoint is needed or permitted.

11. **No frontend cache logic** — Angular services must not use `shareReplay`, `BehaviorSubject` as HTTP cache, or any local storage for API response caching. All data freshness is guaranteed by the API layer.

12. **appsettings.json** — Redis section must be fully removed, not commented out.

---

## SERVICEEXTENSIONS.CS — REQUIRED CHANGES

```csharp
// ─── REMOVE ────────────────────────────────────────────────────
// services.AddMemoryCache();
// services.AddOutputCache(options => { ... });
// services.AddStackExchangeRedisCache(options => { ... });
// services.AddStackExchangeRedisOutputCache(options => { ... });
// services.AddScoped<ICacheService, CacheService>();

// ─── ADD ────────────────────────────────────────────────────────
services.AddSingleton<AppCache>();
services.AddHostedService<CacheWarmupService>();
```

---

## PROGRAM.CS — REQUIRED CHANGES

```csharp
// ─── REMOVE ────────────────────────────────────────────────────
// app.UseOutputCache();

// ─── VERIFY AppCache registration order ─────────────────────────
// CacheWarmupService (IHostedService) runs before app.Run()
// No manual warmup call needed — IHostedService handles it automatically
```

---

## HOMECONTROLLER.CS — FINAL SHAPE

```csharp
[HttpGet]
[AllowAnonymous]
public ActionResult<HomePageDto> GetHomePageData()
{
    _cache.HomePageData.TryGetValue("homepage", out var data);
    return Ok(data ?? new HomePageDto());
}
```

`HomeController` injects only `AppCache` — no service, no DB, no mapper.

---

## SUCCESS CRITERIA — MIGRATION COMPLETE ONLY WHEN ALL PASS

### Compilation
- [ ] `dotnet build` — 0 errors
- [ ] `ng build` — 0 errors

### Reference Elimination
- [ ] 0 references to `ICacheService`
- [ ] 0 references to `CacheService`
- [ ] 0 references to `IMemoryCache`
- [ ] 0 references to `IOutputCacheStore`
- [ ] 0 uses of `[OutputCache]` attribute
- [ ] 0 uses of `[ResponseCache]` attribute
- [ ] 0 `EvictByTagAsync` calls
- [ ] 0 Angular cache interceptor registrations
- [ ] 0 imports of `cache.utils.ts`

### Architecture
- [ ] Single `AppCache` singleton exists and is registered
- [ ] `CacheWarmupService` loads all partitions on startup
- [ ] All admin write operations perform targeted cache update + rebuild where required

### Correctness
- [ ] CRUD operations reflected in cache immediately
- [ ] Homepage data is consistent with individual entity partitions
- [ ] No stale data scenarios under concurrent load

### Reports Generated
- [ ] `cache-audit-report.md`
- [ ] `backend-cache-refactor-report.md`
- [ ] `appcache-architecture-report.md`
- [ ] `cache-lifecycle-report.md`
- [ ] `product-cache-report.md`
- [ ] `cms-cache-report.md`
- [ ] `frontend-cache-refactor-report.md`
- [ ] `performance-report.md`
- [ ] `qa-validation-report.md`
- [ ] `final-migration-blueprint.md`

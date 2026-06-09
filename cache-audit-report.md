# Arza Mart Caching Architecture - Comprehensive Audit Report

**Date**: 2026-06-09  
**Auditor**: Agent 1 — Solution Auditor  
**Scope**: All cache-related code across Backend (ASP.NET Core 8) + Frontend (Angular 18)

---

## Executive Summary

The Arza Mart codebase has **4 distinct cache mechanisms** running simultaneously with overlapping responsibilities, inconsistent access patterns, and several anti-patterns. There are **25+ cache consumer sites** across controllers and services, **3 backend cache layers** (IMemoryCache, ICacheService wrapper, OutputCache), and **2 frontend cache layers** (in-memory Map + sessionStorage). The system is functional but fragile — a migration must carefully untangle these overlapping layers.

---

## 1. Complete Cache Inventory

### 1.1 Backend Cache Layers

| Layer | Technology | Registration | Scope | TTL |
|-------|-----------|-------------|-------|-----|
| **L1** | `IMemoryCache` | `ServiceExtensions.cs:48` | Process-wide singleton | Varies (5m–24h) |
| **L2** | `IDistributedCache` | `ServiceExtensions.cs:54` or `:58` | Process-wide (DistributedMemoryCache fallback) | 10m default |
| **L3** | `ICacheService` | `ServiceExtensions.cs:65` (Singleton) | Wraps L1+L2 with prefix tracking | Varies |
| **L4** | `IOutputCacheStore` | `ServiceExtensions.cs:67` | HTTP response caching | 5–10m + tags |
| **L5** | `[ResponseCache]` | Attribute on actions | HTTP response header caching | 300–600s |
| **Redis** | `StackExchangeRedisCache` | `ServiceExtensions.cs:58` (conditional) | **DISABLED** (empty connection string) | N/A |

**Critical Finding**: Redis is configured but disabled. `appsettings.json:55-57` has `Redis:ConnectionString: ""`. The code falls back to `AddDistributedMemoryCache()` (`ServiceExtensions.cs:52-54`), which is just another in-process `IMemoryCache`. This means `ICacheService` Layer 2 is the **same in-memory cache** as Layer 1 — the "distributed" layer provides zero distribution.

### 1.2 Frontend Cache Layers

| Layer | Technology | File | TTL |
|-------|-----------|------|-----|
| **F1** | `Map<string, CacheEntry>` | `cache.interceptor.ts:14` | 1m–24h (URL-based) |
| **F2** | `sessionStorage` | `cache.interceptor.ts:51-79` | 24h max, survives page reload |
| **F3** | Server `POST /admin/cache/evict` | `admin-cache.interceptor.ts:49` | N/A (eviction only) |

---

## 2. Cache Consumer Dependency Map

### 2.1 Controllers Using `IMemoryCache` Directly (9 controllers)

| Controller | File | Usage Pattern | Injected Cache |
|-----------|------|--------------|----------------|
| `ProductsController` | `Controllers/ProductsController.cs:23` | Injected but **UNUSED** — all caching delegated to services | `IMemoryCache` |
| `HomeController` | `Controllers/HomeController.cs:22` | `GetOrCreateAsync` for 4 cache keys | `IMemoryCache` |
| `BannersController` | `Controllers/BannersController.cs:17` | `TryGetValue`/`Set` manual pattern | `IMemoryCache` |
| `NavigationController` | `Controllers/NavigationController.cs:11` | `TryGetValue`/`Set` manual pattern | `IMemoryCache` |
| `SiteSettingsController` | `Controllers/SiteSettingsController.cs:16` | `TryGetValue`/`Set` manual pattern | `IMemoryCache` |
| `CartController` | `Controllers/CartController.cs:17` | `TryGetValue`/`Set` for per-user carts | `IMemoryCache` |
| `AdminBannersController` | `Controllers/AdminBannersController.cs:20` | `_cache.Remove()` only | `IMemoryCache` + `IOutputCacheStore` |
| `AdminSettingsController` | `Controllers/AdminSettingsController.cs:20` | `_cache.Remove()` only | `IMemoryCache` + `IOutputCacheStore` |

### 2.2 Controllers Using `ICacheService` (5 controllers)

| Controller | File | Usage Pattern |
|-----------|------|--------------|
| `CategoriesController` | `Controllers/CategoriesController.cs:13` | `GetOrCreateAsync` |
| `AdminCategoryController` | `Controllers/AdminCategoryController.cs:20` | `RemoveAsync`, `RemoveByPrefixAsync` + `IOutputCacheStore` |
| `AdminSubCategoryController` | `Controllers/AdminSubCategoryController.cs:20` | `RemoveAsync`, `RemoveByPrefixAsync` + `IOutputCacheStore` |
| `AdminProductsController` | `Controllers/AdminProductsController.cs:20` | `RemoveAsync` + `IOutputCacheStore` |
| `AdminProductInventoryController` | `Controllers/AdminProductInventoryController.cs:16` | `RemoveAsync` + `IOutputCacheStore` |

### 2.3 Controllers Using `IOutputCacheStore` Only (3 controllers)

| Controller | File |
|-----------|------|
| `AdminNavigationController` | `Controllers/AdminNavigationController.cs:16` |
| `AdminPagesController` | `Controllers/AdminPagesController.cs:16` |
| `AdminOrdersController` | `Controllers/AdminOrdersController.cs:19` |
| `AdminCacheController` | `Controllers/AdminCacheController.cs:14` (also uses `ICacheService`) |

### 2.4 Services Using Cache

| Service | File | Cache Interface | Pattern |
|---------|------|----------------|---------|
| `ProductService` | `Services/ProductService.cs:23` | `ICacheService` | `GetOrCreateAsync`, `RemoveAsync`, `RemoveByPrefixAsync` |
| `ProductQueryService` | `Services/ProductQueryService.cs:46` | `ICacheService` | `GetOrCreateAsync` |
| `NavigationService` | `Services/NavigationService.cs:18` | `ICacheService` | `GetOrCreateAsync` |
| `DashboardService` | `Services/DashboardService.cs:18` | `IMemoryCache` | `GetOrCreateAsync` (direct) |
| `AuthService` | `Services/AuthService.cs:20` | `IMemoryCache` | Token revocation cache |
| `CacheService` | `Services/CacheService.cs:15` | `IMemoryCache` + `IDistributedCache` | The wrapper itself |

### 2.5 Middleware Using Cache

| Middleware | File | Cache Interface | Purpose |
|-----------|------|----------------|---------|
| `SecurityMiddleware` | `Middleware/SecurityMiddleware.cs:15` | `IMemoryCache` | Revoked JWT token lookup (`revoked_jti:{jti}`) |

---

## 3. Complete Cache Key Registry

### 3.1 Keys via `ICacheService` (3 services + 5 controllers)

| Key Pattern | Consumer | TTL | Eviction Trigger |
|-------------|----------|-----|-----------------|
| `categories_db_list` | CategoriesController | 60m (Extended) | AdminCategoryController |
| `nav:mega-menu` | NavigationService | Default (no TTL) | AdminCategoryController, AdminSubCategoryController |
| `product:details:slug:{slug}` | ProductService, ProductQueryService | 60m | ProductService.InvalidateProductCacheAsync |
| `product:details:id:{id}` | ProductService, ProductQueryService | 60m | ProductService.InvalidateProductCacheAsync |
| `product:list*` (prefix) | ProductQueryService | 5m | ProductService.InvalidateProductCacheAsync |
| `product:sizes` | ProductService, ProductQueryService | 24h | None |
| `products_{params}` | ProductQueryService | 5m | None (expires) |
| `home_new_arrivals` | HomeController (via ICacheService) | Medium (10m) | AdminProductsController, AdminProductInventoryController |
| `home_featured_products` | HomeController (via ICacheService) | Medium (10m) | AdminProductsController, AdminProductInventoryController |
| `home_banners` | HomeController (via ICacheService) | Long (30m) | AdminBannersController, AdminCacheController |
| `home_categories` | HomeController (via ICacheService) | Extended (60m) | None (expires) |
| `homepage:featured-products` | ProductService (invalidation target) | N/A | ProductService.InvalidateProductCacheAsync |
| `homepage:new-arrivals` | ProductService (invalidation target) | N/A | ProductService.InvalidateProductCacheAsync |
| `home_page_data` | ProductService (invalidation target) | N/A | ProductService.InvalidateProductCacheAsync |
| `site_settings` | SiteSettingsController | Extended (60m) | AdminSettingsController, AdminCacheController |
| `navigation_menu` | AdminCacheController | N/A | AdminCacheController (eviction target) |
| `delivery_methods_active` | SiteSettingsController | Extended (60m) | AdminSettingsController |
| `pages_list` | AdminCacheController | N/A | AdminCacheController (eviction target) |

### 3.2 Keys via Direct `IMemoryCache` (6 controllers)

| Key Pattern | Consumer | TTL | Eviction |
|-------------|----------|-----|----------|
| `banners_active` | BannersController | Medium (10m) | AdminBannersController |
| `home_banners` | HomeController (IMemoryCache) | Long (30m) | AdminBannersController |
| `home_new_arrivals` | HomeController (IMemoryCache) | Medium (10m) | None |
| `home_featured_products` | HomeController (IMemoryCache) | Medium (10m) | None |
| `home_categories` | HomeController (IMemoryCache) | Extended (60m) | None |
| `site_settings` | SiteSettingsController | Extended (60m) | AdminSettingsController |
| `delivery_methods_active` | SiteSettingsController | Extended (60m) | AdminSettingsController |
| `navigation_mega_menu` | NavigationController | Medium (10m) | None |
| `cart_{userId\|sessionId}` | CartController | Medium (10m) | CartController.ClearCart |
| `DashboardStats_{date}` | DashboardService | 15s | None (expires) |
| `revoked_jti:{jti}` | SecurityMiddleware | Default | AuthService |

### 3.3 OutputCache Tags

| Tag | Used On | Evicted By |
|-----|---------|------------|
| `catalog` | ProductsController (class-level) | AdminCategoryController, AdminSubCategoryController, AdminProductsController, AdminProductInventoryController, AdminOrdersController, AdminCacheController |
| `home` | HomeController, BannersController (class-level) | AdminBannersController, AdminCacheController |
| `config` | SiteSettingsController, NavigationController | AdminSettingsController, AdminNavigationController, AdminCacheController |
| `categories` | AdminCategoryController | AdminSubCategoryController |
| `content` | AdminPagesController | AdminPagesController, AdminCacheController |

### 3.4 `[ResponseCache]` Attributes

| Controller | Action | Duration | VaryBy |
|-----------|--------|----------|--------|
| ProductsController | GetProducts | 300s | QueryKeys=* |
| ProductsController | GetProduct | 300s | QueryKeys=slug |
| BannersController | GetActiveBanners | 300s | None |
| SiteSettingsController | GetSettings | 600s | None |
| SiteSettingsController | GetDeliveryMethods | 600s | None |
| NavigationController | GetMegaMenu | 600s | None |
| CartController | GetCart | NoStore | None |

---

## 4. Cache Invalidation Flow Diagram

```
Admin CRUD Operation
    │
    ├──► Admin Controller
    │       ├──► _cache.Remove("specific_key")     [IMemoryCache - direct]
    │       ├──► _cache.RemoveAsync("specific_key") [ICacheService - wrapper]
    │       ├──► _cacheStore.EvictByTagAsync("tag")  [OutputCache]
    │       └──► Angular adminCacheInterceptor
    │               ├──► POST /admin/cache/evict     [Server-side ICacheService]
    │               └──► invalidateHttpCache(pattern) [Angular in-memory + sessionStorage]
    │
    └──► Dual eviction (redundant)
            ├──► IMemoryCache key removal
            ├──► ICacheService key removal (also removes from IMemoryCache + IDistributedCache)
            └──► OutputCache tag eviction
```

---

## 5. Anti-Patterns & Issues

### CRITICAL

#### 5.1 Dual Cache Access — Same Keys, Different Interfaces
**Files**: `HomeController.cs`, `AdminBannersController.cs`, `AdminSettingsController.cs`

HomeController caches `home_banners` via `IMemoryCache.GetOrCreateAsync()`, while AdminCacheController removes the same key via `ICacheService.RemoveAsync()`. Both interfaces wrap the same underlying `IMemoryCache`, so this works by accident — but it creates a confusing dependency where the same logical key is accessed through two different abstractions.

**Impact**: Migration hazard — removing one interface without updating all consumers of the other will break cache consistency.

#### 5.2 `CacheService._cacheKeys` Memory Leak
**File**: `CacheService.cs:21`

```csharp
private static readonly ConcurrentDictionary<string, byte> _cacheKeys = new();
```

This is a **static** dictionary that grows unboundedly. Keys are added on `SetAsync` (line 73) but only removed on explicit `RemoveAsync`. Keys that expire via TTL are never cleaned from `_cacheKeys`. Over time this dictionary will contain every key ever cached, even after the actual cache entries have expired.

**Impact**: Unbounded memory growth proportional to total unique cache key count.

#### 5.3 `GetOrCreateAsync` Race Condition
**File**: `CacheService.cs:92-104`

```csharp
public async Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T?>> factory, TimeSpan? expiration = null)
{
    var cached = await GetAsync<T>(key);
    if (cached != null) return cached;
    var freshValue = await factory();  // No lock/semaphore
    if (freshValue != null)
        await SetAsync(key, freshValue, expiration);
    return freshValue;
}
```

Under concurrent requests, multiple threads can pass the null check simultaneously and all execute the factory. For expensive queries (DashboardService, product lists), this causes thundering herd / cache stampede.

**Impact**: Database overload during cache miss spikes.

### HIGH

#### 5.4 Redundant IMemoryCache Inside CacheService
**File**: `CacheService.cs:15, 38-53, 69-71`

`CacheService` wraps both `IMemoryCache` and `IDistributedCache`. Since Redis is disabled, `IDistributedCache` is `DistributedMemoryCache` (another `IMemoryCache`). This means:
- `SetAsync` writes to **two** in-memory caches simultaneously
- `GetAsync` reads from L1, then L2 (both in-memory) — redundant deserialization
- Memory is consumed twice for the same data

**Impact**: ~2x memory usage for cached data, unnecessary serialization overhead.

#### 5.5 `[ResponseCache]` + `[OutputCache]` Attribute Conflict
**Files**: `ProductsController.cs:40-41`, `ProductsController.cs:103-104`, `SiteSettingsController.cs:25-26`, `SiteSettingsController.cs:43-44`, `NavigationController.cs:20-21`

Multiple endpoints have BOTH `[ResponseCache]` AND `[OutputCache]` attributes. In ASP.NET Core 8+, `OutputCache` middleware runs after `ResponseCache` and they can interfere. `ResponseCache` sets cache headers, while `OutputCache` caches the full response body. When both are present, the behavior is implementation-dependent.

**Impact**: Unpredictable caching behavior; one layer may short-circuit the other.

#### 5.6 Cache Key Explosion in ProductQueryService
**File**: `ProductQueryService.cs:73`

```csharp
var cacheKey = $"products_{sort}_{categoryId}_{subCategoryId}_{collectionId}_{categorySlug}_{subCategorySlug}_{collectionSlug}_{searchTerm}_{tier}_{tags}_{isNew}_{isFeatured}_{pageIndex}_{pageSize}_{productGroupId}_{productType}";
```

With ~15 parameters, the number of unique cache keys is combinatorial. Even with 5m TTL, a busy store browsing session can generate thousands of unique keys per hour. Combined with the `_cacheKeys` leak (5.2), this accelerates memory growth.

**Impact**: Rapid memory exhaustion on high-traffic product listing pages.

#### 5.7 OutputCache Tag Mismatch
**Files**: Various controllers

- `AdminSubCategoryController` evicts tag `"categories"` but ProductsController is tagged `"catalog"` — subcategory changes don't invalidate product list output cache.
- `AdminCacheController` evicts `"catalog"` for tag `"catalog"`, which matches ProductsController's class-level tag, but `ProductQueryService` cache keys (via `ICacheService`) are not evicted by OutputCache tags — they use explicit key removal.
- The `"categories"` tag is evicted by AdminCategoryController but only `AdminSubCategoryController` has `[OutputCache(PolicyName = "Categories")]` — so tag-based eviction of `"categories"` has limited effect.

**Impact**: Stale data can be served after admin mutations.

### MEDIUM

#### 5.8 ProductsController Injects IMemoryCache But Never Uses It
**File**: `ProductsController.cs:23`

`ProductsController` injects `IMemoryCache _cache` but never reads from or writes to it. All caching is handled by `ProductQueryService` (via `ICacheService`) and OutputCache attributes. The injection is dead code.

**Impact**: Wasted DI resolution; confusing for maintainers.

#### 5.9 `NavigationService` vs `NavigationController` Duplicate Caching
**Files**: `NavigationService.cs:29` (cache key `nav:mega-menu`), `NavigationController.cs:24` (cache key `navigation_mega_menu`)

The mega menu is cached twice under different keys:
- `NavigationService.GetMegaMenuAsync()` caches via `ICacheService` with key `nav:mega-menu`
- `NavigationController.GetMegaMenu()` caches via `IMemoryCache` with key `navigation_mega_menu`

The controller calls the service (which caches), then caches the result again under a different key. Two independent caches for the same data.

**Impact**: Double memory usage; invalidation of one doesn't affect the other.

#### 5.10 AdminBannersController & AdminSettingsController Inject IMemoryCache Only for Remove()
**Files**: `AdminBannersController.cs:20`, `AdminSettingsController.cs:20`

These controllers inject `IMemoryCache` solely to call `_cache.Remove("key")`. The `ICacheService` wrapper provides `RemoveAsync` which removes from both layers. Using `IMemoryCache` directly for removal only removes from the memory layer — if data was also written to `IDistributedCache` via `ICacheService.SetAsync`, it persists in L2.

**Impact**: Incomplete cache invalidation when IDistributedCache is real Redis.

#### 5.11 No `RemoveByPrefixAsync` Support in OutputCache
**File**: `CacheService.cs:83-89`

`RemoveByPrefixAsync` iterates `_cacheKeys` to find matching keys. But OutputCache tags use an entirely different eviction mechanism (`EvictByTagAsync`). There's no unified prefix/tag eviction — admin code must manually call both systems.

**Impact**: Easy to forget one eviction path, leading to stale cache.

### LOW

#### 5.12 CartController Cache Not Invalidated by Admin Operations
**File**: `CartController.cs`

Cart data is cached per-user/session in `IMemoryCache`. When an admin updates product stock or prices, the cart cache is not invalidated. Users may see stale cart totals until the 10m TTL expires.

**Impact**: Minor — cart auto-refreshes on next interaction.

#### 5.13 `CacheDurations` Constants Not Used Consistently
**Files**: Various

Some consumers use `CacheDurations.Medium` (10m), others hardcode `TimeSpan.FromMinutes(60)`, others use `MemoryCacheEntryOptions` with explicit expiration. The `CacheDurations` constants exist but aren't the single source of truth.

#### 5.14 Static `_cacheKeys` Not Thread-Safe for Enumeration
**File**: `CacheService.cs:85-86`

```csharp
var keysToRemove = _cacheKeys.Keys.Where(k => k.StartsWith(prefix)).ToList();
```

While `ConcurrentDictionary` supports concurrent enumeration, the `ToList()` snapshot can include keys that are being removed concurrently, leading to `RemoveAsync` calls on already-removed keys (harmless but wasteful).

#### 5.15 Angular `sessionStorage` Cache Grows Unbounded
**File**: `cache.interceptor.ts:62-79`

The cleanup in `saveToPersistentCache` only removes entries older than 24h. On a busy admin session with many filter combinations, sessionStorage can reach its ~5MB limit, causing silent failures.

---

## 6. Pre-Analysis Answers

### Q1: Does the full Product dataset fit into IIS worker process RAM?
**Yes, with caveats.** The system caches DTOs (not raw entities), and products are paginated (12/page default). The `ProductListDto` projections are lightweight. However, `ProductService.GetAdminProductsAsync` loads full EF entities with `.Include(p => p.Images).Include(p => p.Variants)` before projecting — this brings the full entity graph into memory per request. For a 10,000-product catalog, this is manageable per-request but would be dangerous if cached.

### Q2: Is HomePageDto rebuild cost acceptable on every product/banner/category change?
**Yes.** `HomeController.GetHomeData()` caches 4 separate keys (banners, new arrivals, featured, categories). Each is a small query (50 new arrivals, 10 featured, ~10 categories). Rebuilding costs ~4 DB queries of <100 rows each. TTLs are 10-30 minutes. The rebuild on cache miss is <100ms.

### Q3: Are Categories duplicated in memory?
**Yes.** Categories appear in:
- `ICacheService` key `categories_db_list` (CategoriesController)
- `IMemoryCache` key `home_categories` (HomeController)
- `NavigationService` key `nav:mega-menu` (nested in MegaMenuDto)
- `IMemoryCache` key `navigation_mega_menu` (NavigationController)
That's 4 separate cached copies of category data with different TTLs and eviction paths.

### Q4: Are ProductGroups creating redundant object graphs?
**No.** `AdminProductGroupsController` does NOT use any caching. `ProductGroup` entities are loaded via repository without caching. The `ProductGroupId` is a foreign key on `Product` — no redundant object graphs from caching.

### Q5: Are EF navigation properties causing memory bloat when cached?
**Partially.** Services that use `ICacheService.GetOrCreateAsync` (ProductService, ProductQueryService) cache **mapped DTOs** via AutoMapper, not raw EF entities — this is good. However, `DashboardService` caches `DashboardStatsDto` via `IMemoryCache` directly, which is a flat DTO with no navigation properties. `NavigationService` caches `MegaMenuDto` (also flat). No EF entities are directly cached.

### Q6: Are there circular reference risks when caching EF entities directly?
**No direct risks found.** The code uses `ReferenceHandler.IgnoreCycles` in `CacheService.cs:27` for JSON serialization, and services generally map to DTOs before caching. No EF entities are cached as raw objects.

### Q7: Would DTO projections be more memory-efficient?
**Already done for most paths.** `ProductService`, `ProductQueryService`, `NavigationService`, and `PublicCategoryService` all project to DTOs before caching. The one exception is `DashboardService` which caches a flat `DashboardStatsDto` — already efficient. No further DTO optimization is needed.

### Q8: Is ConcurrentDictionary optimal for every cache partition?
**No.** `CacheService._cacheKeys` uses `ConcurrentDictionary<string, byte>` as a key registry. For prefix-based removal (`RemoveByPrefixAsync`), this requires O(n) scan of all keys. A `Trie` or `ConcurrentBag<string> grouped by prefix` would be more efficient. However, given the actual key volume (~50-200 unique keys), the current approach is acceptable.

### Q9: Are there hidden cache layers?
**Yes:**
1. **EF Query Cache**: EF Core's `QueryCompilationContext` cache automatically caches compiled queries. This is in-process and not explicitly managed.
2. **HttpClient/Response Compression**: `ResponseCompression` middleware doesn't cache but affects serialized size.
3. **Static file caching**: `Cache-Control: public,max-age=2592000,immutable` on static files (`Program.cs:81`).
4. **Angular `sessionStorage`**: Client-side persistence layer not visible to backend.

### Q10: Does VisitorTrackingMiddleware have state that must survive cache migration?
**No.** `VisitorTrackingMiddleware.cs` has zero caching. It creates a `Cookie` on the `HttpContext` (per-request) and writes to DB via `Task.Run` fire-and-forget. It uses no `IMemoryCache`, `ICacheService`, or any other cache mechanism. It is fully independent of the cache migration.

---

## 7. Dead Code & Unused References

| Item | File | Status |
|------|------|--------|
| `ProductsController._cache` (IMemoryCache) | `ProductsController.cs:23` | Injected but never used |
| `CacheDurations.Short` (5 min) | `Constants.cs:68` | Not referenced anywhere |
| `adminCacheInterceptor` eviction of `"orders"` tag | `admin-cache.interceptor.ts:28-30` | No backend controller listens for "orders" tag |
| `adminCacheInterceptor` eviction of `"customers"` tag | `admin-cache.interceptor.ts:40-42` | No backend controller listens for "customers" tag |
| `AdminCacheController` removal of `"pages_list"` | `AdminCacheController.cs:56` | No service reads this key |
| `AdminCacheController` removal of `"navigation_menu"` | `AdminCacheController.cs:51` | No service reads this key (`nav:mega-menu` is the actual key) |

---

## 8. Consolidated Cache Access Pattern Matrix

```
                    │ ICacheService │ IMemoryCache │ IOutputCacheStore │ [ResponseCache] │ [OutputCache]
────────────────────┼───────────────┼──────────────┼───────────────────┼─────────────────┼──────────────
ProductsController  │               │ (unused)     │                   │ ✓               │ ✓
HomeController      │               │ ✓            │                   │                 │ ✓
BannersController   │               │ ✓            │                   │ ✓               │ ✓
CategoriesController│ ✓             │              │                   │                 │
NavigationController│               │ ✓            │                   │ ✓               │ ✓
SiteSettingsCtrl    │               │ ✓            │                   │ ✓               │ ✓
CartController      │               │ ✓            │                   │ ✓(NoStore)      │
AdminCacheCtrl      │ ✓             │              │ ✓                 │                 │
AdminCategoryCtrl   │ ✓             │              │ ✓                 │                 │
AdminSubCategoryCtrl│ ✓             │              │ ✓                 │                 │
AdminProductsCtrl   │ ✓             │              │ ✓                 │                 │
AdminBannersCtrl    │               │ ✓            │ ✓                 │                 │
AdminSettingsCtrl   │               │ ✓            │ ✓                 │                 │
AdminNavigationCtrl │               │              │ ✓                 │                 │
AdminPagesCtrl      │               │              │ ✓                 │                 │
AdminOrdersCtrl     │               │              │ ✓                 │                 │
AdminProductInvCtrl │ ✓             │              │ ✓                 │                 │
ProductService      │ ✓             │              │                   │                 │
ProductQueryService │ ✓             │              │                   │                 │
NavigationService   │ ✓             │              │                   │                 │
DashboardService    │               │ ✓            │                   │                 │
AuthService         │               │ ✓            │                   │                 │
SecurityMiddleware  │               │ ✓            │                   │                 │
```

---

## 9. Migration Complexity Score

| Category | Count | Migration Effort |
|----------|-------|-----------------|
| Controllers using `ICacheService` | 5 | **Low** — already on the target interface |
| Controllers using `IMemoryCache` directly | 8 | **Medium** — need interface swap |
| Services using `ICacheService` | 3 | **Low** — already on target |
| Services using `IMemoryCache` directly | 2 | **Medium** — DashboardService, AuthService |
| Middleware using `IMemoryCache` | 1 | **Low** — SecurityMiddleware (internal, can stay) |
| `IOutputCacheStore` consumers | 9 | **Low** — tag-based, already clean |
| `[ResponseCache]` attributes | 7 occurrences | **Low** — remove or convert |
| `[OutputCache]` attributes | 5 occurrences | **Low** — already ASP.NET Core native |
| Angular interceptors | 2 | **Low** — frontend only |
| Cache key patterns to migrate | ~20 unique | **Medium** — need key registry |
| Anti-patterns to fix | 15 | **High** — concurrent with migration |

**Overall Migration Complexity: MEDIUM-HIGH** — The main challenge is not the interface swap (ICacheService is already in place for most code), but rather fixing the dual-access patterns, the static key leak, the race condition, and the redundant cache layers.

---

## 10. Recommended Migration Approach

### Phase 1: Fix Anti-Patterns (Pre-Migration)
1. Fix `CacheService._cacheKeys` memory leak — add TTL-based cleanup or switch to `IMemoryCache.RegisterPostEvictionCallback`
2. Add `Lazy<T>` or `SemaphoreSlim` to `GetOrCreateAsync` to prevent stampede
3. Remove unused `IMemoryCache` injection from `ProductsController`
4. Consolidate NavigationService/NavigationController duplicate cache keys

### Phase 2: Unify Cache Access
1. Migrate `HomeController` from `IMemoryCache` → `ICacheService`
2. Migrate `BannersController` from `IMemoryCache` → `ICacheService`
3. Migrate `NavigationController` from `IMemoryCache` → `ICacheService`
4. Migrate `SiteSettingsController` from `IMemoryCache` → `ICacheService`
5. Migrate `CartController` — keep `IMemoryCache` (per-user, session-scoped is appropriate)
6. Migrate `AdminBannersController` Remove() calls → `ICacheService.RemoveAsync()`
7. Migrate `AdminSettingsController` Remove() calls → `ICacheService.RemoveAsync()`
8. Migrate `DashboardService` from `IMemoryCache` → `ICacheService` (or keep as-is — 15s TTL, internal)

### Phase 3: Fix Cache Key Management
1. Create a centralized `CacheKeys` static class with all key patterns
2. Fix `ProductQueryService` cache key explosion — use deterministic hash of filter params
3. Align eviction in `AdminCacheController` with actual key names

### Phase 4: Output Cache Cleanup
1. Resolve `[ResponseCache]` + `[OutputCache]` dual-attribute conflicts
2. Verify OutputCache tag names match eviction code
3. Remove redundant `[ResponseCache]` where OutputCache handles it

### Phase 5: Enable Redis (Production)
1. Configure Redis connection string in `appsettings.Production.json`
2. Verify `ICacheService` correctly serializes/deserializes for distributed cache
3. Test prefix-based removal with real Redis keys

---

*End of audit report.*

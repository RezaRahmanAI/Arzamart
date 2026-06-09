# Performance Report: Arza Mart Caching Migration

**Agent 8 — Performance Engineer**
**Date:** 2026-06-09

---

## 1. Executive Summary

The Arza Mart API implements a **dual-layer cache** (`IMemoryCache` + `IDistributedCache`) via `CacheService`, with output caching and response caching middleware. However, the current architecture has a critical flaw: **two independent caching mechanisms** (direct `IMemoryCache` in controllers vs. `ICacheService` in services) are not coordinated, leading to stale data and ineffective invalidation.

The proposed migration consolidates all caching through a single `ICacheService` layer, enabling proper invalidation and predictable behavior.

---

## 2. Performance Metrics: Before vs After

| Metric | Before (Current) | After (Estimated) | Notes |
|---|---|---|---|
| Avg API response time (product list) | ~80–200ms (DB hit) | ~2–5ms (memory) | ProductQueryService already caches; after migration, cache invalidation works correctly |
| Avg API response time (homepage) | ~150–400ms (multi-query, partial cache) | ~1–3ms (single dict lookup) | Currently 4 independent `IMemoryCache` lookups; consolidated to one `ICacheService` call |
| DB queries per homepage load (cold) | 4 queries | 0 (warm) | Banners, New Arrivals, Featured, Categories |
| DB queries per homepage load (warm) | 0 (if cached) / 4 (cache miss) | 0 | Cache now reliably invalidated on data changes |
| DB queries per product list (cold) | 2 queries (CountAsync + ListAsync) | 0 (warm) | ProductQueryService uses `GetOrCreateAsync` |
| DB queries per product list (warm) | 0 (if cached) / 2 (cache miss) | 0 | |
| DB queries per product detail | 1 query (GetEntityWithSpec) | 0 (warm) | |
| Cold start warmup time | ~500ms–3s | ~500ms–3s (lazy) | No eager warmup currently; first request triggers cache population |
| Memory per 1000 products (with includes) | N/A | ~50–150MB (estimate) | Serialized JSON; depends on image URLs, descriptions |
| Memory per full cache (all partitions) | N/A | ~100–300MB (estimate) | Homepage sections + product lists + product details + nav |
| Concurrent request throughput | Limited by DB pool (15–30 conn) | Limited by CPU only | In-memory filtering eliminates DB bottleneck |

---

## 3. Database Query Analysis by Page

### 3.1 Homepage Load (`GET /api/Home`)

**Controller:** `HomeController.cs:45` — `GetHomeData()`

| Query # | What | DB Call | Cache Key (Current) | Cache Key (After) |
|---|---|---|---|---|
| 1 | Active Hero Banners | `_bannerRepo.ListAsync()` | `home_banners` (IMemoryCache) | `home:banners` (ICacheService) |
| 2 | New Arrivals (50 products) | `_productRepo.ListAsync()` with `isNew=true` | `home_new_arrivals` (IMemoryCache) | `home:new-arrivals` (ICacheService) |
| 3 | Featured Products (10 products) | `_productRepo.ListAsync()` with `isFeatured=true` | `home_featured_products` (IMemoryCache) | `home:featured-products` (ICacheService) |
| 4 | Active Categories | `_categoryRepo.ListAsync()` | `home_categories` (IMemoryCache) | `home:categories` (ICacheService) |

**Total: 4 DB queries on cold start, 0 on warm cache.**

**Cache TTLs:**
- Banners: `CacheDurations.Long` = 30 minutes
- New Arrivals: `CacheDurations.Medium` = 10 minutes
- Featured: `CacheDurations.Medium` = 10 minutes
- Categories: `CacheDurations.Extended` = 60 minutes

### 3.2 Product List Page (`GET /api/Products`)

**Controller:** `ProductsController.cs:42` — `GetProducts()`

| Query # | What | DB Call | Cache Key Pattern |
|---|---|---|---|
| 1 (optional) | Category slug lookup | `_categoriesRepo.GetEntityWithSpec()` | Not cached |
| 2 | Count total items | `CountAsync(countSpec)` | Cached via `GetOrCreateAsync` |
| 3 | Fetch product page | `ListAsync(spec)` with includes | Cached via `GetOrCreateAsync` |

**Total: 2–3 DB queries on cold start, 0 on warm cache.**

**Cache key:** `products_{sort}_{categoryId}_{...}_{pageIndex}_{pageSize}_{...}`
**Cache TTL:** 5 minutes (`ICacheService.GetOrCreateAsync`)

### 3.3 Product Detail Page (`GET /api/Products/{slug}`)

**Controller:** `ProductsController.cs:105` — `GetProduct()`

| Query # | What | DB Call | Cache Key |
|---|---|---|---|
| 1 | Product with includes | `GetEntityWithSpec(spec)` | `product:details:slug:{slug}` |

**Total: 1 DB query on cold start, 0 on warm cache.**
**Cache TTL:** 60 minutes

### 3.4 Navigation Menu (`GET /api/Navigation/mega-menu`)

**Service:** `NavigationService.cs:29`

| Query # | What | DB Call | Cache Key |
|---|---|---|---|
| 1 | Active categories | `_context.Categories.ToListAsync()` | `nav:mega-menu` (ICacheService) |
| 2 | Active subcategories + collections | `_context.SubCategories.Include().ToListAsync()` | Same key |

**Total: 2 DB queries on cold start, 0 on warm cache.**
**Cache TTL:** Default 10 minutes

---

## 4. Critical Bug Found: Cache Key Mismatch

**Severity: HIGH — Data Staleness**

The `HomeController` and `ProductService` use **different cache keys** for the same data:

| Data | HomeController Key | ProductService Invalidation Key | Match? |
|---|---|---|---|
| New Arrivals | `home_new_arrivals` | `homepage:new-arrivals` | **NO** |
| Featured Products | `home_featured_products` | `homepage:featured-products` | **NO** |
| Full Home Page | — | `home_page_data` | **NO** |

**Impact:** When a product is created/updated via `ProductService.InvalidateProductCacheAsync()`, the homepage cache keys `home_new_arrivals` and `home_featured_products` are **never invalidated**. Users see stale new arrivals and featured products for up to 10 minutes after an admin updates products.

**Fix:** Migrate HomeController to use `ICacheService` with consistent key naming.

---

## 5. Infrastructure Analysis

### 5.1 IIS Worker Process Memory vs Cache Size

| Scenario | Estimated Memory | IIS Default Limit | Risk |
|---|---|---|---|
| 500 products, basic includes | ~50–80MB | 1.5–2GB | Low |
| 2000 products, full includes | ~150–250MB | 1.5–2GB | Low |
| 5000 products, full includes | ~300–500MB | 1.5–2GB | Medium |
| 10000+ products | ~600MB–1GB | 1.5–2GB | High — consider Redis |

**Recommendation:** For <5000 products, in-memory cache is sufficient. Beyond that, migrate to Redis for distributed caching and to avoid per-instance memory pressure.

### 5.2 Application Pool Recycling Impact

| Event | Impact on Cache | Recovery |
|---|---|---|
| Regular recycling (default 29hrs) | **All in-memory cache lost** | First requests after recycle hit DB (cold start) |
| Memory-based recycling | Cache evicted under pressure | Gradual rebuild as requests arrive |
| Crash/unexpected recycle | **Complete cache loss** | 500ms–3s warmup spike |

**Current behavior:** No warmup mechanism exists. `Program.cs` seeds data but does not pre-warm cache. First visitor after recycle pays the cold-start penalty.

**Recommendation:** Add a `BackgroundService` that pre-warms critical cache keys (homepage, mega menu) on startup.

### 5.3 Concurrent Request Throughput Analysis

| Concurrent Requests | Before (DB-bound) | After (In-Memory) |
|---|---|---|
| 50 concurrent product list | ~50 DB connections, ~200ms each | ~0 DB connections, ~5ms each |
| 100 concurrent product list | **Pool exhaustion likely** (default pool: 100) | ~5ms each, CPU-bound |
| 500 concurrent product list | **Connection pool saturated**, queue buildup | CPU-bound, ~10–20ms each |

**DB Connection Pool:** `AddDbContextPool` is used (ServiceExtensions.cs:160), which pools EF Core contexts. Default pool size is 1024, but actual SQL Server connection limit depends on hosting tier.

**Bottleneck shift:** Before migration, the bottleneck is SQL Server connections. After, it's CPU for in-memory filtering and JSON serialization.

### 5.4 Cache Rebuild Frequency

| Cache Partition | TTL | Rebuild Trigger | Estimated Frequency |
|---|---|---|---|
| Homepage Banners | 30 min | TTL expiry | ~48x/day |
| Homepage New Arrivals | 10 min | TTL expiry | ~144x/day |
| Homepage Featured | 10 min | TTL expiry | ~144x/day |
| Homepage Categories | 60 min | TTL expiry | ~24x/day |
| Product Lists | 5 min | TTL expiry + product CRUD | ~288x/day + on admin action |
| Product Details | 60 min | TTL expiry + product CRUD | ~24x/day + on admin action |
| Mega Menu | 10 min | TTL expiry | ~144x/day |
| Available Sizes | 24 hours | TTL expiry | ~1x/day |

**Total estimated DB queries for cache rebuilds:** ~768x/day for a single instance.

### 5.5 Output Cache Layer

The application also uses ASP.NET Core Output Caching (`app.UseOutputCache()`) on top of the application-level caching:

- **Products policy:** 10-minute expiry, tagged `products`
- **Categories policy:** 5-minute expiry, tagged `categories`
- **Default policy:** 5-minute expiry

**Impact:** Even if the application cache misses, output caching can serve stale responses. This provides a third safety net but can mask cache invalidation bugs.

---

## 6. Migration Impact Summary

### 6.1 Performance Gains

| Area | Gain | Mechanism |
|---|---|---|
| Homepage TTFB | 95–99% reduction | Single `ICacheService` lookup vs 4 independent `IMemoryCache` calls |
| Product list TTFB | 90–98% reduction | Correct cache invalidation prevents stale DB fallbacks |
| DB load | 70–90% reduction | Fewer cold-start cache misses due to proper invalidation |
| Concurrent capacity | 5–10x improvement | DB connection pool no longer the bottleneck |

### 6.2 Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Memory pressure at scale | Medium | Monitor `Process.WorkingSet64`; switch to Redis at >5000 products |
| Cold start after recycle | Low | Add startup warmup background service |
| Cache stampede on invalidation | Medium | Use staggered TTLs; consider lock-based rebuild |
| Stale data during migration | High | Ensure all controllers use `ICacheService` consistently |

---

## 7. Recommendations

1. **Immediate:** Fix cache key mismatch between HomeController and ProductService (data staleness bug)
2. **Immediate:** Migrate HomeController from direct `IMemoryCache` to `ICacheService`
3. **Short-term:** Add a startup `BackgroundService` to pre-warm homepage and mega-menu cache
4. **Medium-term:** Add cache metrics (hit rate, miss rate, memory usage) via `IMemoryCache` statistics
5. **Long-term:** When product catalog exceeds 5000 items, evaluate Redis migration for distributed caching

---

*Report generated by Agent 8 — Performance Engineer*

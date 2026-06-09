# Cache Lifecycle Report — Arza Mart Caching Migration

## 1. CacheWarmupService Summary

**File:** `ECommerce.Infrastructure/cache/CacheWarmupService.cs`

An `IHostedService` that runs once at application startup. It resolves a scoped `ApplicationDbContext` via `IServiceScopeFactory` (safe for singleton lifetime), loads all public-facing read data from the database, and populates the singleton `AppCache` in-memory dictionaries.

### Warmup Sequence
1. **Products** — All active products with Images, Variants, Category included
2. **Categories** — All active categories with SubCategories; SubCategories separately
3. **Banners** — Active HeroBanners ordered by DisplayOrder
4. **Navigation** — All NavigationMenus with ChildMenus, pre-built into `MegaMenuCategoryDto` tree
5. **SiteSettings** — SiteSetting + DeliveryMethods (separate query, no nav property)
6. **ProductGroups** — All ProductGroups with Products
7. **HomePage** — Composite DTO built entirely from in-memory cache (zero DB hit)

---

## 2. Startup Failure Handling Design

### Strategy: Fail-Safe, Not Fail-Fast

The warmup is **best-effort**. If the database is unreachable or partially loaded:

- `StartAsync` catches no exceptions — it propagates to the host, which logs via Serilog and continues booting (the app already uses a placeholder connection string fallback in `AddDatabaseServices`).
- Individual `WarmUp*Async` methods are independent — a failure in `WarmUpBannersAsync` does not block products or categories from loading.
- `WarmUpHomePage()` is pure in-memory and cannot fail if cache data exists.
- If cache dictionaries are empty (warmup failed), the API endpoints return empty results rather than 500s. Controllers already handle empty collections gracefully.

### Recovery Path
- **App restart** re-triggers warmup automatically.
- **No manual invalidation needed** — the cache is permanent until the next restart.
- If DB comes back after partial warmup, a restart is required to repopulate.

---

## 3. Cache Health Monitoring

### Optional `/cache/status` Endpoint

A lightweight diagnostic endpoint (can be admin-only or internal) to expose cache state:

```csharp
// Suggested implementation in HomeController or a dedicated diagnostic controller
[HttpGet("/cache/status")]
public IActionResult CacheStatus()
{
    return Ok(new
    {
        Products = _cache.Products.Count,
        Categories = _cache.Categories.Count,
        SubCategories = _cache.SubCategories.Count,
        Banners = _cache.Banners.Count,
        ProductGroups = _cache.ProductGroups.Count,
        HasNavigation = _cache.NavigationMenus.ContainsKey("main"),
        HasSettings = _cache.SiteSettings.ContainsKey("settings"),
        HasHomePage = _cache.HomePageData.ContainsKey("homepage")
    });
}
```

### Monitoring Recommendations
- **Log warmup completion** with counts (already implemented in `StartAsync`).
- **Alert on zero counts** — if Products.Count == 0 after warmup, the DB is empty or unreachable.
- **Periodic health check** — a background timer or middleware can log cache staleness metrics.

---

## 4. Cache Lifecycle: Warm → Serve → Targeted Update → Serve

### Phase 1: Warm (Startup)
```
App Start → CacheWarmupService.StartAsync() → Load all data → AppCache populated
```

### Phase 2: Serve (Request Time)
```
HTTP Request → Controller → Read from AppCache (O(1) ConcurrentDictionary lookup)
→ Zero DB calls, zero mapping overhead
```

### Phase 3: Targeted Update (Admin Mutations)
```
Admin Create/Update/Delete → Service layer → Mutate DB → Update AppCache in-place
→ Specific dictionary keys updated (e.g., _cache.Products[product.Id] = updatedProduct)
→ HomePage composite rebuilt from affected dependencies
```

### Phase 4: Serve (Post-Update)
```
Next request reads fresh data from AppCache — no cold path, no fallback to DB
```

### Key Design Properties
| Property | Value |
|---|---|
| **TTL** | None — permanent until restart or explicit update |
| **Cold paths** | Zero — all reads served from memory |
| **Thread safety** | `ConcurrentDictionary` for all collections |
| **Startup dependency** | `IServiceScopeFactory` (safe for singleton) |
| **Data freshness** | Immediate on admin mutations, restart on DB changes outside app |

---

## 5. Corrections Applied (vs. Template Code)

| Issue | Template | Actual Codebase | Fix |
|---|---|---|---|
| NavigationMenu nav prop | `.Include(n => n.Children)` | `n.ChildMenus` | Changed to `.Include(n => n.ChildMenus)` |
| HeroBanner order field | `b.Order` | `b.DisplayOrder` | Changed to `b.DisplayOrder` |
| NavigationMenu order field | `n.Order` | `n.DisplayOrder` | Changed to `n.DisplayOrder` |
| ProductGroup filter | `g.IsActive` | No `IsActive` on ProductGroup | Removed filter |
| SiteSettings nav prop | `.Include(s => s.DeliveryMethods)` | No such nav property | Load `DeliveryMethods` separately |
| Product status check | `p.Status == ProductStatus.Active` | No `Status` property on Product; use `p.IsActive` | Changed to `p.IsActive` |
| AutoMapper dependency | `_mapper.MapFrom(...)` | Manual mapping in service layer | Replaced with manual mapping |
| DTO types | `List<T>` properties | `IEnumerable<T>` properties | Mapped to `IEnumerable<T>` |
| Entity namespace | `ECommerce.Core.Domain.*` | `ECommerce.Core.Entities` | Fixed all namespaces |

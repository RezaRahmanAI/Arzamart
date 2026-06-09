# AppCache Architecture Report

## Entity vs DTO Caching Strategy Per Partition

| Partition | Cached Type | Justification |
|---|---|---|
| **Products** | `Product` (entity) | Full entity with navigation props (Variants, Images, Category) is needed for product detail pages and listing projections. Caching the entity avoids re-hydrating from DB. DTOs are computed on-the-fly from the cached entity. |
| **Categories** | `Category` (entity) | Entity includes nested `SubCategories` collection. Admin CRUD mutates the tree in-place; caching the entity means the tree structure is always fresh without recomposition. |
| **SubCategories** | `SubCategory` (entity) | Flat O(1) lookup by Id. Entity includes `Category` FK for reverse-join. Used for breadcrumb resolution and collection lookups. |
| **Banners** | `HeroBanner` (entity) | Small cardinality (~5-10 rows). Raw entity is consumed directly by the controller — no DTO mapping overhead needed for this trivial shape. |
| **Navigation Menus** | `List<MegaMenuCategoryDto>` (DTO) | Pre-built mega menu tree is the **only** shape the frontend consumes. The tree requires 3-level joins (Category → SubCategory → Collection) which are expensive to recompute per-request. Caching the final DTO eliminates the join cost entirely. |
| **Site Settings** | `SiteSettingsDto` (DTO) | Single-row table. The DTO includes `DeliveryMethods` which is a related collection. Caching the DTO avoids the per-request manual mapping from `SiteSetting` entity + `DeliveryMethod` join. |
| **Product Groups** | `ProductGroup` (entity) | Entity includes `Products` collection reference. Used by combo/bundle logic that needs full entity graph. |
| **HomePage** | `HomePageDto` (DTO) | Composite aggregate of banners, new arrivals, featured products, and categories. This is the most expensive query — joins 4 entity types with filtering/sorting. Pre-building the DTO eliminates N+1 and multi-join costs per home page hit. |

### Design Principle
- **Single-entity lookups** → cache the **entity** (Products, Categories, SubCategories, Banners, ProductGroups)
- **Pre-computed composites/joins** → cache the **DTO** (NavigationMenus, SiteSettings, HomePage)

---

## Memory Footprint Estimate Per Partition

| Partition | Est. Row Count | Avg Size/Row | Total Est. |
|---|---|---|---|
| Products | 500–2,000 | ~2 KB (with nav props) | **1–4 MB** |
| Categories | 20–50 | ~0.5 KB | **~25 KB** |
| SubCategories | 50–150 | ~0.3 KB | **~45 KB** |
| Banners | 5–10 | ~0.4 KB | **~4 KB** |
| NavigationMenus | 1 (key: "main") | ~5 KB | **~5 KB** |
| SiteSettings | 1 (key: "settings") | ~1 KB | **~1 KB** |
| ProductGroups | 10–30 | ~0.3 KB | **~9 KB** |
| HomePage | 1 (key: "homepage") | ~15 KB | **~15 KB** |
| **Total** | | | **~1.1–4.1 MB** |

### Notes
- Products dominate memory. With eager-loaded Variants + Images, each Product entity can reach 2–3 KB.
- At 2,000 products worst-case: ~4 MB. This is negligible for a server process.
- ConcurrentDictionary overhead: ~40 bytes per entry (negligible at these cardinalities).
- No TTL means no timer allocations or periodic sweep costs.

---

## Invalidation Scope Per Partition

| Partition | Invalidation Trigger | Scope |
|---|---|---|
| **Products** | Product CRUD, Variant CRUD, Stock update, Review add | Replace single `Product` entry by Id. If IsNew/IsFeatured changed → rebuild HomePage. |
| **Categories** | Category CRUD | Replace single `Category` entry. If tree structure changed → rebuild NavigationMenus + HomePage. |
| **SubCategories** | SubCategory CRUD | Replace single `SubCategory` entry. If Category association changed → rebuild NavigationMenus. |
| **Banners** | HeroBanner CRUD, Toggle IsActive | Replace single `Banner` entry. Rebuild HomePage. |
| **NavigationMenus** | Category/SubCategory/Collection CRUD | Full rebuild of "main" key (single dictionary entry). O(n) in category count. |
| **SiteSettings** | SiteSetting update, DeliveryMethod CRUD | Full rebuild of "settings" key (single dictionary entry). |
| **ProductGroups** | ProductGroup CRUD, Product reassigned to group | Replace single `ProductGroup` entry. |
| **HomePage** | Any change to Products, Categories, Banners, or ProductGroups | Full rebuild of "homepage" key (single dictionary entry). |

### Invalidation Cascades
```
Product CRUD ──────► Products entry ────► HomePage (if IsNew/IsFeatured)
Category CRUD ─────► Categories entry ──► NavigationMenus + HomePage
SubCategory CRUD ──► SubCategories entry ► NavigationMenus
Banner CRUD ───────► Banners entry ─────► HomePage
ProductGroup CRUD ─► ProductGroups entry ► HomePage
Settings update ───► SiteSettings entry (standalone, no cascade)
```

### Scope Summary
- **Local** (single entry replace): Products, SubCategories, Banners, ProductGroups
- **Cascade to HomePage**: Products (conditional), Categories, Banners, ProductGroups
- **Cascade to NavigationMenus**: Categories, SubCategories
- **Isolated**: SiteSettings

---

## Thread-Safety Guarantee Analysis

### Mechanism: `ConcurrentDictionary<TKey, TValue>`

All seven cache partitions use `ConcurrentDictionary` which provides:

| Property | Guarantee |
|---|---|
| **Read safety** | Lock-free for single reads (`TryGetValue`, `ContainsKey`). No contention under read-heavy workloads. |
| **Write safety** | Fine-grained per-bucket locking for `Add`, `AddOrUpdate`, `TryRemove`. Multiple threads can write to different keys concurrently. |
| **Enumeration** | Snapshot semantics — `foreach` over a ConcurrentDictionary sees a consistent snapshot at enumeration start. |
| **Atomic single-key ops** | `AddOrUpdate` and `GetOrAdd` are atomic per key — no lost updates. |

### Pattern: Replace-Whole-Value (Immutable Swap)

The cache follows a **replace-whole-value** pattern for atomic updates:

```csharp
// Thread-safe replace: reads old, writes new atomically per-key
cache.Products[product.Id] = updatedProduct;
```

This is safe because:
1. A reader either sees the old value or the new value — never a partial state.
2. No in-place mutation of entity properties occurs after insertion.
3. `ConcurrentDictionary` ensures the internal bucket lock serializes the swap.

### HomePage and NavigationMenus: Full Rebuild

For composite caches (HomePage, NavigationMenus), invalidation triggers a **full rebuild**:

```csharp
// Build new dictionary entries offline
var newHomePage = BuildHomePage(...);
// Atomic swap — readers see old until this completes
cache.HomePageData["homepage"] = newHomePage;
```

This avoids partial-read issues: the old composite stays valid until the new one is fully constructed and swapped in.

### Risks and Mitigations

| Risk | Mitigation |
|---|---|
| **Stale reads during rebuild** | Acceptable — eventual consistency within single-digit milliseconds. Admin ops are infrequent. |
| **Concurrent rebuilds** | Use a `SemaphoreSlim(1,1)` per composite key to serialize rebuilds. One thread builds, others wait. |
| **Memory pressure during swap** | Old value becomes eligible for GC immediately after swap. At ~4 MB total, this is negligible. |
| **Dictionary key collision** | Single-key entries use fixed string keys ("homepage", "main", "settings") — no collision risk. |
| **Reference sharing** | Entities are EF-tracked snapshots. After caching, they are detached. No lazy-load or tracking side effects. |

### Conclusion

`ConcurrentDictionary` provides sufficient thread-safety for this use case:
- **Read-heavy, write-rare** workload (admin CRUD is orders of magnitude less frequent than customer reads).
- **No partial mutations** — values are replaced atomically, never mutated in-place after insertion.
- **Composite caches** use offline-build + atomic-swap to avoid partial-read windows.

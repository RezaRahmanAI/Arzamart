import { HttpInterceptorFn, HttpResponse } from "@angular/common/http";
import { of, tap } from "rxjs";

interface CacheEntry {
  response: HttpResponse<unknown>;
  timestamp: number;
}

// In-memory cache store
const cache = new Map<string, CacheEntry>();

// Cache TTL in milliseconds (30 seconds for products, 5 min for static data)
const DEFAULT_TTL = 60_000;
const LONG_TTL = 600_000;

// Endpoints that should never be cached
const EXCLUDED_PATTERNS = [
  "/auth/",
  "/admin/",
  "/cart",
  "/orders",
  "/checkout",
  "/customers",
  "/analytics",
  "/sitesettings",
];

function shouldCache(url: string): boolean {
  if (!url.includes("/api/")) return false;
  return !EXCLUDED_PATTERNS.some((pattern) => url.includes(pattern));
}

function getTTL(url: string): number {
  // Static data gets longer cache
  if (
    url.includes("/categories") ||
    url.includes("/banners") ||
    url.includes("/navigation") ||
    url.includes("/settings")
  ) {
    return LONG_TTL;
  }
  return DEFAULT_TTL;
}

/**
 * HTTP Cache Interceptor — Stale-While-Revalidate pattern.
 *
 * For cacheable GET requests:
 * - If a fresh cached response exists (within TTL), return it instantly (0ms network time)
 * - If cache is stale or missing, make the real request and cache the response
 *
 * This dramatically speeds up repeated page loads and navigation.
 */
export const httpCacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only cache GET requests
  if (req.method !== "GET") {
    return next(req);
  }

  // Skip non-API or excluded URLs
  if (!shouldCache(req.urlWithParams)) {
    return next(req);
  }

  const cacheKey = req.urlWithParams;
  const entry = cache.get(cacheKey);
  const now = Date.now();
  const ttl = getTTL(cacheKey);

  // Return cached response if still fresh
  if (entry && now - entry.timestamp < ttl) {
    return of(entry.response.clone());
  }

  // Otherwise, make the request and cache the response
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status === 200) {
        cache.set(cacheKey, {
          response: event.clone(),
          timestamp: Date.now(),
        });
      }
    }),
  );
};

/**
 * Call this to invalidate all cached entries.
 * Useful after admin updates products/categories/banners.
 */
export function clearHttpCache(): void {
  cache.clear();
}

/**
 * Invalidate cache entries matching a pattern.
 * Example: invalidateHttpCache('/products') will clear all product caches.
 */
export function invalidateHttpCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

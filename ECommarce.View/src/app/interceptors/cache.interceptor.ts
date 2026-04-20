import { HttpInterceptorFn, HttpResponse, HttpHeaders } from "@angular/common/http";
import { of, tap } from "rxjs";

interface CacheEntry {
  body: any;
  status: number;
  statusText: string;
  headers: { [key: string]: string[] };
  url: string;
  timestamp: number;
}

// In-memory cache store (Primary)
const inMemoryCache = new Map<string, CacheEntry>();

// Cache TTL in milliseconds
const TTL_CONFIG = 24 * 60 * 60 * 1000; // 24 hours
const TTL_CATALOG = 60 * 60 * 1000;      // 1 hour
const TTL_CONTENT = 30 * 60 * 1000;      // 30 minutes
const TTL_ADMIN_DASHBOARD = 5 * 60 * 1000; // 5 minutes
const TTL_ADMIN_DYNAMIC = 30_000;        // 30 seconds
const DEFAULT_TTL = 60_000;              // 1 minute default

const EXCLUDED_PATTERNS = [
  "/auth/",
  "/cart",
  "/checkout",
  "/analytics",
  "/logs",
  "/user/profile",
];

function shouldCache(url: string): boolean {
  if (!url.includes("/api/")) return false;
  if (EXCLUDED_PATTERNS.some((pattern) => url.includes(pattern))) return false;
  return true;
}

function getTTL(url: string): number {
  if (url.includes("/sitesettings") || url.includes("/navigation") || url.includes("/source-pages") || url.includes("/social-media-sources")) return TTL_CONFIG;
  if (url.includes("/products") || url.includes("/categories") || url.includes("/subcategories")) return TTL_CATALOG;
  if (url.includes("/pages") || url.includes("/banners")) return TTL_CONTENT;
  if (url.includes("/admin/dashboard") || url.includes("/admin/analytics/overview")) return TTL_ADMIN_DASHBOARD;
  if (url.includes("/admin/orders") || url.includes("/admin/customers")) return TTL_ADMIN_DYNAMIC;
  return DEFAULT_TTL;
}

/**
 * Persistence Layer helper to survive page reloads
 */
const STORAGE_KEY = 'arza_api_cache';

function getPersistentCache(): Record<string, CacheEntry> {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveToPersistentCache(key: string, entry: CacheEntry) {
  try {
    const persistent = getPersistentCache();
    persistent[key] = entry;
    
    // Cleanup expired entries before saving to manage space
    const now = Date.now();
    for (const k in persistent) {
        if (now - persistent[k].timestamp > (24 * 60 * 60 * 1000)) { // Max 24h limit for storage
            delete persistent[k];
        }
    }
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistent));
  } catch (e) {
    console.warn('Cache persistence failed (likely storage full)', e);
  }
}

function clearPersistentCache(pattern?: string) {
    if (!pattern) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
    }
    try {
        const persistent = getPersistentCache();
        let changed = false;
        for (const key in persistent) {
            if (key.includes(pattern)) {
                delete persistent[key];
                changed = true;
            }
        }
        if (changed) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistent));
        }
    } catch {}
}

/**
 * HTTP Cache Interceptor — Enhanced with SessionStorage Persistence
 */
export const httpCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== "GET" || !shouldCache(req.urlWithParams)) {
    return next(req);
  }

  const cacheKey = req.urlWithParams;
  const forceRefresh = req.headers.has("X-Refresh");

  if (!forceRefresh) {
    const now = Date.now();
    const ttl = getTTL(cacheKey);

    // 1. Check In-Memory
    let entry = inMemoryCache.get(cacheKey);

    // 2. Check SessionStorage if not in memory
    if (!entry) {
        const persistent = getPersistentCache();
        if (persistent[cacheKey]) {
            entry = persistent[cacheKey];
            inMemoryCache.set(cacheKey, entry); // Hydrate in-memory
        }
    }

    if (entry && (now - entry.timestamp < ttl)) {
      // Reconstruct HttpResponse
      return of(new HttpResponse({
        body: entry.body,
        status: entry.status,
        statusText: entry.statusText,
        headers: new HttpHeaders(entry.headers),
        url: entry.url
      }));
    }
  }

  const cleanHeaders = req.headers.delete("X-Refresh");
  const clonedReq = req.clone({ headers: cleanHeaders });

  return next(clonedReq).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status === 200) {
        const headers: { [key: string]: string[] } = {};
        event.headers.keys().forEach(key => {
            headers[key] = event.headers.getAll(key) || [];
        });

        const entry: CacheEntry = {
          body: event.body,
          status: event.status,
          statusText: event.statusText,
          headers: headers,
          url: event.url || '',
          timestamp: Date.now(),
        };

        inMemoryCache.set(cacheKey, entry);
        saveToPersistentCache(cacheKey, entry);
      }
    }),
  );
};

/**
 * Invalidate cache entries matching a pattern.
 */
export function invalidateHttpCache(pattern: string): void {
  // Clear Memory
  for (const key of inMemoryCache.keys()) {
    if (key.includes(pattern)) {
        inMemoryCache.delete(key);
    }
  }
  // Clear Storage
  clearPersistentCache(pattern);
}

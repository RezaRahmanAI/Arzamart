import {
  HttpInterceptorFn,
  HttpResponse,
  HttpHeaders,
} from "@angular/common/http";
import { of, tap } from "rxjs";

interface CacheEntry {
  body: any;
  status: number;
  statusText: string;
  headers: { [key: string]: string[] };
  url: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

const TTL = {
  NAVIGATION: 15 * 60 * 1000,
  CATEGORIES: 15 * 60 * 1000,
  SETTINGS: 30 * 60 * 1000,
  BANNERS: 10 * 60 * 1000,
  PRODUCTS: 5 * 60 * 1000,
  DEFAULT: 60 * 1000,
};

const EXCLUDED = ["/cart", "/orders", "/auth", "/profile"];

function shouldCache(url: string): boolean {
  if (!url.includes("/api/")) return false;
  return !EXCLUDED.some((p) => url.includes(p));
}

function getTTL(url: string): number {
  if (url.includes("/navigation") || url.includes("/categories") || url.includes("/subcategories"))
    return TTL.NAVIGATION;
  if (url.includes("/sitesettings")) return TTL.SETTINGS;
  if (url.includes("/banners")) return TTL.BANNERS;
  if (url.includes("/products")) return TTL.PRODUCTS;
  return TTL.DEFAULT;
}

export const httpCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== "GET" || !shouldCache(req.urlWithParams)) {
    return next(req);
  }

  const key = req.urlWithParams;
  const forceRefresh = req.headers.has("X-Refresh");

  if (!forceRefresh) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < getTTL(key)) {
      return of(
        new HttpResponse({
          body: entry.body,
          status: entry.status,
          statusText: entry.statusText,
          headers: new HttpHeaders(entry.headers),
          url: entry.url,
        }),
      );
    }
  }

  const cleanReq = req.clone({ headers: req.headers.delete("X-Refresh") });

  return next(cleanReq).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status === 200) {
        const headers: { [key: string]: string[] } = {};
        event.headers.keys().forEach((k) => {
          headers[k] = event.headers.getAll(k) || [];
        });
        cache.set(key, {
          body: event.body,
          status: event.status,
          statusText: event.statusText,
          headers,
          url: event.url || "",
          timestamp: Date.now(),
        });
      }
    }),
  );
};

export function invalidateHttpCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

export function clearHttpCache(): void {
  cache.clear();
}

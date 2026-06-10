import {
  HttpInterceptorFn,
  HttpResponse,
  HttpClient,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { filter, tap } from "rxjs";
import { invalidateHttpCache } from "./http-cache.interceptor";
import { API_CONFIG } from "../config/api.config";

export const adminCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === "GET" || !req.url.includes("/admin/")) {
    return next(req);
  }

  if (req.url.includes("/cache/evict")) {
    return next(req);
  }

  const http = inject(HttpClient);
  const apiConfig = inject(API_CONFIG);

  return next(req).pipe(
    filter((event) => event instanceof HttpResponse && event.status >= 200 && event.status < 300),
    tap(() => {
      const patterns: string[] = [];

      if (
        req.url.includes("/products") ||
        req.url.includes("/categories") ||
        req.url.includes("/subcategories")
      ) {
        patterns.push("/products", "/categories", "/subcategories");
      } else if (req.url.includes("/orders")) {
        patterns.push("/orders");
      } else if (req.url.includes("/banners") || req.url.includes("/home")) {
        patterns.push("/banners", "/home");
      } else if (
        req.url.includes("/settings") ||
        req.url.includes("/navigation")
      ) {
        patterns.push("/sitesettings", "/navigation");
      } else if (req.url.includes("/pages")) {
        patterns.push("/pages");
      } else if (req.url.includes("/customers")) {
        patterns.push("/customers");
      }

      patterns.forEach((p) => invalidateHttpCache(p));
      invalidateHttpCache("/admin/dashboard");
      invalidateHttpCache("/admin/analytics");

      const tags = patterns.length > 0 ? ["catalog"] : [];
      if (tags.length > 0) {
        const baseUrl = apiConfig.baseUrl.replace(/\/$/, "");
        http.post(`${baseUrl}/admin/cache/evict`, { tags }).subscribe({
          error: () => {},
        });
      }
    }),
  );
};

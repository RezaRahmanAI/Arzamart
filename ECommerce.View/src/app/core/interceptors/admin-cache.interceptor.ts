import {
  HttpInterceptorFn,
  HttpResponse,
} from "@angular/common/http";
import { filter, tap } from "rxjs";
import { invalidateHttpCache } from "./http-cache.interceptor";

export const adminCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === "GET" || !req.url.includes("/admin/")) {
    return next(req);
  }

  if (req.url.includes("/cache/evict")) {
    return next(req);
  }

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
      } else if (req.url.includes("/reviews")) {
        patterns.push("/reviews");
      } else if (req.url.includes("/security")) {
        patterns.push("/security");
      } else if (req.url.includes("/product-groups")) {
        patterns.push("/product-groups");
      } else if (req.url.includes("/staff")) {
        patterns.push("/staff");
      } else if (req.url.includes("/profile")) {
        patterns.push("/profile");
      }

      patterns.forEach((p) => invalidateHttpCache(p));
      invalidateHttpCache("/admin/dashboard");
    }),
  );
};

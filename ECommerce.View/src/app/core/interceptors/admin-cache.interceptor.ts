import {
  HttpInterceptorFn,
  HttpResponse,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { filter, tap } from "rxjs";
import { invalidateHttpCache } from "./http-cache.interceptor";
import { CacheService } from "../cache/cache.service";

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
      const cacheService = inject(CacheService);

      if (req.url.includes("/products") || req.url.includes("/categories") || req.url.includes("/subcategories")) {
        invalidateHttpCache("/products");
        invalidateHttpCache("/categories");
        invalidateHttpCache("/subcategories");
        cacheService.clearStore('categories');
        cacheService.clearStore('subcategories');
        cacheService.clearStore('productDetails');
        cacheService.clearStore('featuredProducts');
        cacheService.clearStore('trendingProducts');
        cacheService.clearStore('popularProducts');
        cacheService.clearStore('homepage');
      } else if (req.url.includes("/orders")) {
        invalidateHttpCache("/orders");
      } else if (req.url.includes("/banners") || req.url.includes("/home")) {
        invalidateHttpCache("/banners");
        invalidateHttpCache("/home");
        cacheService.clearStore('banners');
        cacheService.clearStore('homepage');
      } else if (req.url.includes("/settings") || req.url.includes("/navigation")) {
        invalidateHttpCache("/sitesettings");
        invalidateHttpCache("/navigation");
        cacheService.clearStore('siteSettings');
        cacheService.clearStore('navigation');
      } else if (req.url.includes("/pages")) {
        invalidateHttpCache("/pages");
        cacheService.clearStore('staticPages');
      } else if (req.url.includes("/customers")) {
        invalidateHttpCache("/customers");
      } else if (req.url.includes("/reviews")) {
        invalidateHttpCache("/reviews");
        cacheService.clearStore('productReviews');
      } else if (req.url.includes("/product-groups")) {
        invalidateHttpCache("/product-groups");
        cacheService.clearStore('productGroups');
      } else if (req.url.includes("/profile")) {
        invalidateHttpCache("/profile");
      } else if (req.url.includes("/custom-landing-page")) {
        cacheService.clearStore('landingPages');
      }

      invalidateHttpCache("/admin/dashboard");
    }),
  );
};

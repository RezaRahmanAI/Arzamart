import { HttpInterceptorFn, HttpResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, filter } from 'rxjs';
import { invalidateHttpCache } from './cache.interceptor';
import { API_CONFIG } from '../core/config/api.config';

export const adminCacheInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const apiConfig = inject(API_CONFIG);
  
  // Skip if it's the eviction call itself to avoid recursion
  if (req.url.includes('/cache/evict')) {
    return next(req);
  }

  // Only intercept non-GET admin requests (modifications)
  if (req.method !== 'GET' && req.url.includes('/admin/')) {
    return next(req).pipe(
      filter(event => event instanceof HttpResponse && event.status >= 200 && event.status < 300),
      tap(() => {
        // Map admin URL segments to cache tags
        let tags: string[] = [];
        let patterns: string[] = [];
        
        if (req.url.includes('/products') || req.url.includes('/categories') || req.url.includes('/subcategories')) {
          tags = ['catalog'];
          patterns = ['/products', '/categories', '/subcategories', '/admin/products', '/admin/subcategories'];
        } else if (req.url.includes('/orders')) {
          tags = ['orders'];
          patterns = ['/admin/orders'];
        } else if (req.url.includes('/banners') || req.url.includes('/home')) {
          tags = ['home'];
          patterns = ['/banners', '/home', '/admin/banners'];
        } else if (req.url.includes('/settings') || req.url.includes('/navigation') || req.url.includes('/source-pages') || req.url.includes('/social-media-sources')) {
          tags = ['config'];
          patterns = ['/sitesettings', '/navigation', '/admin/source-pages', '/admin/social-media-sources'];
        } else if (req.url.includes('/pages')) {
          tags = ['content'];
          patterns = ['/pages', '/admin/pages'];
        } else if (req.url.includes('/customers')) {
          tags = ['customers'];
          patterns = ['/admin/customers'];
        }

        if (tags.length > 0 || patterns.length > 0) {
          // Fire and forget eviction call to server using full URL (if supported by backend)
          if (tags.length > 0) {
            const baseUrl = apiConfig.baseUrl.replace(/\/$/, '');
            http.post(`${baseUrl}/admin/cache/evict`, { tags }).subscribe({
                error: () => {} // Silently fail if eviction endpoint not ready
            });
          }
          
          // Clear local cache for these patterns
          patterns.forEach(p => invalidateHttpCache(p));
          
          // Also clear dashboard stats when anything major changes
          invalidateHttpCache('/admin/dashboard');
          invalidateHttpCache('/admin/analytics');
        }
      })
    );
  }

  return next(req);
};

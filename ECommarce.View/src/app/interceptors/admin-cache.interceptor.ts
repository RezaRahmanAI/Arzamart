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

  // Only intercept non-GET admin requests
  if (req.method !== 'GET' && req.url.includes('/api/admin/')) {
    return next(req).pipe(
      filter(event => event instanceof HttpResponse && event.status >= 200 && event.status < 300),
      tap(() => {
        // Map admin URL segments to cache tags
        let tags: string[] = [];
        let patterns: string[] = [];
        
        if (req.url.includes('/products') || req.url.includes('/categories')) {
          tags = ['catalog'];
          patterns = ['/products', '/categories'];
        } else if (req.url.includes('/banners') || req.url.includes('/home')) {
          tags = ['home'];
          patterns = ['/banners', '/home'];
        } else if (req.url.includes('/settings') || req.url.includes('/navigation')) {
          tags = ['config'];
          patterns = ['/sitesettings', '/navigation'];
        } else if (req.url.includes('/pages')) {
          tags = ['content'];
          patterns = ['/pages'];
        }

        if (tags.length > 0) {
          // Fire and forget eviction call to server using full URL
          const baseUrl = apiConfig.baseUrl.replace(/\/$/, '');
          http.post(`${baseUrl}/admin/cache/evict`, { tags }).subscribe();
          
          // Clear local cache for these patterns
          patterns.forEach(p => invalidateHttpCache(p));
        }
      })
    );
  }

  return next(req);
};

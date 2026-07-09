import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CacheService } from './cache.service';
import { CacheStore } from './cache-types';
import { ApiHttpClient } from '../http/http-client';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface PrefetchItem {
  store: CacheStore;
  key: string;
  url: string;
  priority: number;
}

const PREFETCH_QUEUE: PrefetchItem[] = [
  { store: 'navigation', key: 'main', url: '/navigation/mega-menu', priority: 1 },
  { store: 'categories', key: 'all', url: '/categories', priority: 2 },
  { store: 'siteSettings', key: 'settings', url: '/sitesettings', priority: 3 },
  { store: 'homepage', key: 'home', url: '/home', priority: 4 },
  { store: 'banners', key: 'active', url: '/banners', priority: 5 },
];

@Injectable({ providedIn: 'root' })
export class PrefetchService {
  private readonly cache = inject(CacheService);
  private readonly api = inject(ApiHttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private prefetched = false;

  prefetchAll(): void {
    if (this.prefetched) return;
    if (!isPlatformBrowser(this.platformId)) return;
    this.prefetched = true;

    const sorted = [...PREFETCH_QUEUE].sort((a, b) => a.priority - b.priority);

    let delay = 0;
    for (const item of sorted) {
      setTimeout(() => {
        this.cache.get(item.store, item.key).subscribe(cached => {
          if (cached && !cached.stale) return;
          this.api.getWithHeaders(item.url).pipe(
            catchError(() => of(null))
          ).subscribe(result => {
            if (result && result.data) {
              this.cache.set(item.store, item.key, result.data, result.etag ?? undefined, result.cacheVersion ?? undefined);
            }
          });
        });
      }, delay);
      delay += 500;
    }
  }

  prefetchRouteData(route: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const prefetchMap: Record<string, PrefetchItem[]> = {
      '/category/': [
        { store: 'categories', key: 'all', url: '/categories', priority: 1 },
      ],
      '/product/': [
        { store: 'categories', key: 'all', url: '/categories', priority: 1 },
      ],
    };

    const match = Object.keys(prefetchMap).find(pattern => route.startsWith(pattern));
    if (!match) return;

    for (const item of prefetchMap[match]) {
      this.cache.get(item.store, item.key).subscribe(cached => {
        if (cached && !cached.stale) return;
        this.api.getWithHeaders(item.url).pipe(
          catchError(() => of(null))
        ).subscribe(result => {
          if (result && result.data) {
            this.cache.set(item.store, item.key, result.data, result.etag ?? undefined, result.cacheVersion ?? undefined);
          }
        });
      });
    }
  }

  prefetchOnHover(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const routePrefetchMap: Record<string, () => void> = {
      '/men': () => this.prefetchCategories(),
      '/women': () => this.prefetchCategories(),
      '/children': () => this.prefetchCategories(),
      '/accessories': () => this.prefetchCategories(),
      '/offers': () => this.prefetchCategories(),
    };

    const matched = Object.keys(routePrefetchMap).find(pattern => url.startsWith(pattern));
    if (matched) {
      routePrefetchMap[matched]();
    }
  }

  private prefetchCategories(): void {
    this.cache.get('categories', 'all').subscribe(cached => {
      if (cached && !cached.stale) return;
      this.api.getWithHeaders('/categories').pipe(
        catchError(() => of(null))
      ).subscribe(result => {
        if (result?.data) {
          this.cache.set('categories', 'all', result.data, result.etag ?? undefined, result.cacheVersion ?? undefined);
        }
      });
    });
  }
}

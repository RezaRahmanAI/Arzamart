import { Injectable, inject } from '@angular/core';
import { Observable, of, from, switchMap, tap, map, catchError, BehaviorSubject, merge } from 'rxjs';
import { CacheStore, CacheEntry, CACHE_TTL } from './cache-types';
import { IndexedDbService } from './indexeddb.service';
import { CacheMetadataService } from './cache-metadata.service';
import { RequestDedupService } from './request-dedup.service';
import { CacheVersionService } from './cache-version.service';
import { ApiResponse } from '../http/http-client';

export interface CacheResult<T> {
  data: T;
  stale: boolean;
  source: 'cache' | 'api';
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly indexedDb = inject(IndexedDbService);
  private readonly metadata = inject(CacheMetadataService);
  private readonly dedup = inject(RequestDedupService);
  private readonly versionService = inject(CacheVersionService);
  private readonly updates = new Map<string, BehaviorSubject<any>>();

  private getUpdateSubject<T>(key: string): BehaviorSubject<T | null> {
    let subject = this.updates.get(key);
    if (!subject) {
      subject = new BehaviorSubject<T | null>(null);
      this.updates.set(key, subject);
    }
    return subject;
  }

  get<T>(store: CacheStore, key: string): Observable<CacheResult<T> | null> {
    return from(this.indexedDb.get<T>(store, key)).pipe(
      map(entry => {
        if (!entry) return null;
        const expired = Date.now() > entry.expiresAt;
        return { data: entry.data, stale: expired, source: 'cache' } as CacheResult<T>;
      })
    );
  }

  getOrFetch<T>(
    store: CacheStore,
    key: string,
    fetchFn: (ifNoneMatch: string | null) => Observable<ApiResponse<T>>,
    ttl?: number,
  ): Observable<CacheResult<T>> {
    const dedupKey = `${store}:${key}`;
    const updateSubject = this.getUpdateSubject<T>(dedupKey);
    const resolvedTtl = ttl ?? CACHE_TTL[store];

    const cache$ = from(this.indexedDb.get<T>(store, key)).pipe(
      map(entry => {
        if (!entry) return null;
        const expired = Date.now() > entry.expiresAt;
        return {
          data: entry.data,
          stale: expired,
          source: 'cache',
          etag: entry.etag,
        } as CacheResult<T> & { etag: string | null };
      })
    );

    const fetch$ = this.dedup.getOrMake(dedupKey, () =>
      from(this.indexedDb.get<T>(store, key)).pipe(
        switchMap(entry => {
          const ifNoneMatch = entry?.etag ?? null;
          return fetchFn(ifNoneMatch).pipe(
            tap(result => {
              if (result.status === 304 && entry) {
                entry.expiresAt = Date.now() + resolvedTtl;
                this.indexedDb.set(store, entry);
                return;
              }
              if (result.data !== null) {
                const newEntry: CacheEntry<T> = {
                  key,
                  data: result.data,
                  version: result.cacheVersion,
                  etag: result.etag,
                  cachedAt: Date.now(),
                  expiresAt: Date.now() + resolvedTtl,
                };
                this.indexedDb.set(store, newEntry).catch(() => {});
                this.metadata.updateMetadata(store, result.cacheVersion, result.etag);
                updateSubject.next(result.data);
              }
            }),
            map(result => {
              if (result.status === 304 && entry) {
                return { data: entry.data, stale: false, source: 'cache' } as CacheResult<T>;
              }
              if (result.data === null) {
                throw new Error('Empty response');
              }
              return { data: result.data, stale: false, source: 'api' } as CacheResult<T>;
            })
          );
        })
      )
    );

    return cache$.pipe(
      switchMap(cached => {
        if (!cached) {
          return fetch$;
        }
        if (!cached.stale) {
          return of({ data: cached.data, stale: false, source: 'cache' as const });
        }
        return merge(
          of({ data: cached.data, stale: true, source: 'cache' as const }),
          fetch$
        );
      })
    );
  }

  revalidate<T>(
    store: CacheStore,
    key: string,
    fetchFn: (ifNoneMatch: string | null) => Observable<ApiResponse<T>>,
    ttl?: number,
  ): Observable<CacheResult<T>> {
    const dedupKey = `${store}:${key}:revalidate`;
    const resolvedTtl = ttl ?? CACHE_TTL[store];

    return this.dedup.getOrMake(dedupKey, () =>
      from(this.indexedDb.get<T>(store, key)).pipe(
        switchMap(entry => {
          const ifNoneMatch = entry?.etag ?? null;
          return fetchFn(ifNoneMatch).pipe(
            switchMap(result => {
              if (result.status === 304 && entry) {
                entry.expiresAt = Date.now() + resolvedTtl;
                return from(this.indexedDb.set(store, entry)).pipe(
                  map(() => ({ data: entry.data, stale: false, source: 'cache' as const }))
                );
              }
              const newEntry: CacheEntry<T> = {
                key,
                data: result.data,
                version: result.cacheVersion,
                etag: result.etag,
                cachedAt: Date.now(),
                expiresAt: Date.now() + resolvedTtl,
              };
              return from(this.indexedDb.set(store, newEntry)).pipe(
                tap(() => {
                  this.metadata.updateMetadata(store, result.cacheVersion, result.etag);
                  const subject = this.updates.get(dedupKey);
                  if (subject) subject.next(result.data);
                }),
                map(() => ({ data: result.data, stale: false, source: 'api' as const }))
              );
            })
          );
        })
      )
    );
  }

  async set<T>(store: CacheStore, key: string, data: T, etag?: string, cacheVersion?: string, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      data,
      version: cacheVersion ?? null,
      etag: etag ?? null,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (ttl ?? CACHE_TTL[store]),
    };
    try {
      await this.indexedDb.set(store, entry);
      this.metadata.updateMetadata(store, cacheVersion ?? null, etag ?? null);
    } catch {
      // silently fail
    }
  }

  remove(store: CacheStore, key: string): void {
    this.indexedDb.delete(store, key).catch(() => {});
    this.metadata.removeMetadata(store);
  }

  clearStore(store: CacheStore): void {
    this.indexedDb.clearStore(store).catch(() => {});
    this.metadata.removeMetadata(store);
  }

  clearAll(): void {
    this.indexedDb.clearAll().catch(() => {});
    this.metadata.clearAll();
    this.dedup.cancelAll();
  }

  invalidateByPattern(store: CacheStore, pattern: string): void {
    this.indexedDb.deleteByPattern(store, pattern).catch(() => {});
  }
}

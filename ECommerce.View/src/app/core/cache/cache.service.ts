import { Injectable, inject } from '@angular/core';
import { Observable, of, from, switchMap, tap, map, catchError, BehaviorSubject, merge } from 'rxjs';
import { CacheStore, CacheEntry, CACHE_TTL } from './cache-types';
import { IndexedDbService } from './indexeddb.service';
import { CacheMetadataService } from './cache-metadata.service';
import { RequestDedupService } from './request-dedup.service';
import { CacheVersionService } from './cache-version.service';

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
    fetchFn: () => Observable<T>,
    options?: {
      ttl?: number;
      version?: string;
      etag?: string;
    }
  ): Observable<CacheResult<T>> {
    const dedupKey = `${store}:${key}`;
    const updateSubject = this.getUpdateSubject<T>(dedupKey);

    const cache$ = from(this.indexedDb.get<T>(store, key)).pipe(
      map(entry => {
        if (!entry) return null;
        const expired = Date.now() > entry.expiresAt;
        return { data: entry.data, stale: expired, source: 'cache' } as CacheResult<T>;
      })
    );

    const fetch$ = this.dedup.getOrMake(dedupKey, () => fetchFn().pipe(
      tap(data => {
        const entry: CacheEntry<T> = {
          key,
          data,
          version: options?.version ?? null,
          etag: options?.etag ?? null,
          cachedAt: Date.now(),
          expiresAt: Date.now() + (options?.ttl ?? CACHE_TTL[store]),
        };
        this.indexedDb.set(store, entry);
        this.metadata.updateMetadata(store, options?.version ?? null, options?.etag ?? null);
        updateSubject.next(data);
      }),
      catchError(err => {
        return from(this.indexedDb.get<T>(store, key)).pipe(
          map(entry => {
            if (entry) return entry.data;
            throw err;
          })
        );
      })
    ));

    return cache$.pipe(
      switchMap(cached => {
        if (cached && !cached.stale) {
          return of(cached);
        }
        if (cached && cached.stale) {
          const update$ = fetch$.pipe(
            map(data => ({ data, stale: false, source: 'api' as const }))
          );
          return merge(of(cached), update$);
        }
        return fetch$.pipe(
          map(data => ({ data, stale: false, source: 'api' as const }))
        );
      })
    );
  }

  revalidate<T>(
    store: CacheStore,
    key: string,
    fetchFn: () => Observable<T>,
    options?: { version?: string; etag?: string; ttl?: number }
  ): Observable<CacheResult<T>> {
    const dedupKey = `${store}:${key}:revalidate`;

    return this.dedup.getOrMake(dedupKey, () => fetchFn().pipe(
      switchMap(data => {
        const entry: CacheEntry<T> = {
          key,
          data,
          version: options?.version ?? null,
          etag: options?.etag ?? null,
          cachedAt: Date.now(),
          expiresAt: Date.now() + (options?.ttl ?? CACHE_TTL[store]),
        };
        return from(this.indexedDb.set(store, entry)).pipe(
          tap(() => {
            this.metadata.updateMetadata(store, options?.version ?? null, options?.etag ?? null);
            const updateKey = `${store}:${key}`;
            const subject = this.updates.get(updateKey);
            if (subject) subject.next(data);
          }),
          map(() => ({ data, stale: false, source: 'api' as const }))
        );
      })
    ));
  }

  set<T>(store: CacheStore, key: string, data: T, options?: { ttl?: number; version?: string; etag?: string }): void {
    const entry: CacheEntry<T> = {
      key,
      data,
      version: options?.version ?? null,
      etag: options?.etag ?? null,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (options?.ttl ?? CACHE_TTL[store]),
    };
    this.indexedDb.set(store, entry);
    this.metadata.updateMetadata(store, options?.version ?? null, options?.etag ?? null);
  }

  remove(store: CacheStore, key: string): void {
    this.indexedDb.delete(store, key);
    this.metadata.removeMetadata(store);
  }

  clearStore(store: CacheStore): void {
    this.indexedDb.clearStore(store);
    this.metadata.removeMetadata(store);
  }

  clearAll(): void {
    this.indexedDb.clearAll();
    this.metadata.clearAll();
    this.dedup.cancelAll();
  }

  invalidateByPattern(store: CacheStore, pattern: string): void {
    this.indexedDb.deleteByPattern(store, pattern);
  }
}

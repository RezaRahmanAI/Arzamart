import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CacheStore, METADATA_KEY_PREFIX } from './cache-types';

export interface CacheMetadata {
  version: string | null;
  etag: string | null;
  cachedAt: number | null;
  lastSyncAt: number | null;
}

@Injectable({ providedIn: 'root' })
export class CacheMetadataService {
  private readonly platformId = inject(PLATFORM_ID);

  private isAvailable(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getVersion(store: CacheStore): string | null {
    if (!this.isAvailable()) return null;
    try {
      const data = localStorage.getItem(`${METADATA_KEY_PREFIX}version`);
      if (!data) return null;
      const versions = JSON.parse(data);
      return versions[store] ?? null;
    } catch {
      return null;
    }
  }

  setVersion(store: CacheStore, version: string): void {
    if (!this.isAvailable()) return;
    try {
      const key = `${METADATA_KEY_PREFIX}version`;
      const data = localStorage.getItem(key);
      const versions: Record<string, string> = data ? JSON.parse(data) : {};
      versions[store] = version;
      localStorage.setItem(key, JSON.stringify(versions));
    } catch {}
  }

  getEtag(store: CacheStore): string | null {
    if (!this.isAvailable()) return null;
    try {
      const data = localStorage.getItem(`${METADATA_KEY_PREFIX}etag`);
      if (!data) return null;
      const etags = JSON.parse(data);
      return etags[store] ?? null;
    } catch {
      return null;
    }
  }

  setEtag(store: CacheStore, etag: string): void {
    if (!this.isAvailable()) return;
    try {
      const key = `${METADATA_KEY_PREFIX}etag`;
      const data = localStorage.getItem(key);
      const etags: Record<string, string> = data ? JSON.parse(data) : {};
      etags[store] = etag;
      localStorage.setItem(key, JSON.stringify(etags));
    } catch {}
  }

  getLastSyncAt(store: CacheStore): number | null {
    if (!this.isAvailable()) return null;
    try {
      const data = localStorage.getItem(`${METADATA_KEY_PREFIX}ts`);
      if (!data) return null;
      const timestamps = JSON.parse(data);
      return timestamps[store] ?? null;
    } catch {
      return null;
    }
  }

  setLastSyncAt(store: CacheStore): void {
    if (!this.isAvailable()) return;
    try {
      const key = `${METADATA_KEY_PREFIX}ts`;
      const data = localStorage.getItem(key);
      const timestamps: Record<string, number> = data ? JSON.parse(data) : {};
      timestamps[store] = Date.now();
      localStorage.setItem(key, JSON.stringify(timestamps));
    } catch {}
  }

  getMetadata(store: CacheStore): CacheMetadata {
    return {
      version: this.getVersion(store),
      etag: this.getEtag(store),
      cachedAt: null,
      lastSyncAt: this.getLastSyncAt(store),
    };
  }

  updateMetadata(store: CacheStore, version: string | null, etag: string | null): void {
    if (version) this.setVersion(store, version);
    if (etag) this.setEtag(store, etag);
    this.setLastSyncAt(store);
  }

  removeMetadata(store: CacheStore): void {
    if (!this.isAvailable()) return;
    try {
      const versionKey = `${METADATA_KEY_PREFIX}version`;
      const etagKey = `${METADATA_KEY_PREFIX}etag`;
      const tsKey = `${METADATA_KEY_PREFIX}ts`;

      const versions = JSON.parse(localStorage.getItem(versionKey) || '{}');
      delete versions[store];
      localStorage.setItem(versionKey, JSON.stringify(versions));

      const etags = JSON.parse(localStorage.getItem(etagKey) || '{}');
      delete etags[store];
      localStorage.setItem(etagKey, JSON.stringify(etags));

      const timestamps = JSON.parse(localStorage.getItem(tsKey) || '{}');
      delete timestamps[store];
      localStorage.setItem(tsKey, JSON.stringify(timestamps));
    } catch {}
  }

  clearAll(): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.removeItem(`${METADATA_KEY_PREFIX}version`);
      localStorage.removeItem(`${METADATA_KEY_PREFIX}etag`);
      localStorage.removeItem(`${METADATA_KEY_PREFIX}ts`);
    } catch {}
  }
}

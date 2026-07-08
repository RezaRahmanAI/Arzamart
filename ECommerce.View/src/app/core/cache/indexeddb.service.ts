import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CacheStore, CacheEntry, DB_NAME, DB_VERSION, CACHE_STORES } from './cache-types';

@Injectable({ providedIn: 'root' })
export class IndexedDbService {
  private readonly platformId = inject(PLATFORM_ID);
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(new Error('Not in browser'));
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const store of CACHE_STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'key' });
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getDb(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    if (!this.initPromise) {
      this.initPromise = this.openDb().then(db => {
        this.db = db;
      });
    }
    return this.initPromise.then(() => this.db!);
  }

  async get<T>(store: CacheStore, key: string): Promise<CacheEntry<T> | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async set<T>(store: CacheStore, entry: CacheEntry<T>): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(store: CacheStore, key: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearStore(store: CacheStore): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      for (const store of CACHE_STORES) {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).clear();
        tx.oncomplete = () => {};
        tx.onerror = () => reject(tx.error);
      }
      resolve();
    });
  }

  async getAllKeys(store: CacheStore): Promise<string[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAllKeys();
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteByPattern(store: CacheStore, pattern: string): Promise<void> {
    const keys = await this.getAllKeys(store);
    const matching = keys.filter(k => k.includes(pattern));
    await Promise.all(matching.map(k => this.delete(store, k)));
  }
}

import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, map, tap } from "rxjs";
import { Category } from "../models/category";
import { ApiHttpClient } from "../http/http-client";
import { CacheService } from "../cache/cache.service";

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  private readonly api = inject(ApiHttpClient);
  private readonly cache = inject(CacheService);

  private cacheKey = 'all';

  getCategories(refresh = false): Observable<Category[]> {
    if (refresh) {
      return this.api.getWithHeaders<Category[]>("/categories").pipe(
        tap(result => {
          if (result.data) {
            this.cache.set('categories', this.cacheKey, result.data, result.etag ?? undefined, result.cacheVersion ?? undefined);
          }
        }),
        map(result => result.data),
        shareReplay(1)
      );
    }
    return this.cache.getOrFetch('categories', this.cacheKey,
      (ifNoneMatch) => this.api.getWithHeaders<Category[]>("/categories", { ifNoneMatch })
    ).pipe(
      map(result => result.data),
      shareReplay(1)
    );
  }

  getCategoryBySlug(slug: string): Observable<Category | undefined> {
    return this.getCategories().pipe(
      map(cats => cats.find(c => c.slug === slug))
    );
  }
}

import { Injectable, inject, PLATFORM_ID, TransferState, makeStateKey } from "@angular/core";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { HttpContext } from "@angular/common/http";
import { Observable, of, shareReplay, BehaviorSubject, switchMap, tap } from "rxjs";
import { catchError } from "rxjs/operators";
import { HomeData } from "../models/home-data";

import { ApiHttpClient } from "../http/http-client";
import {
  Product,
} from "../models/product";
import { Pagination } from "../models/pagination";
import { Review } from "../models/review";

@Injectable({
  providedIn: "root",
})
export class ProductService {
  private readonly api = inject(ApiHttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = "/products";

  private readonly refreshSubject = new BehaviorSubject<void>(void 0);
  private readonly cache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_TTL = 60 * 60 * 1000;

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expires) return entry.data as T;
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    if (this.cache.size > 50) {
      const first = this.cache.keys().next().value;
      if (first) this.cache.delete(first);
    }
    this.cache.set(key, { data, expires: Date.now() + this.CACHE_TTL });
  }

  readonly homeData$ = this.refreshSubject.pipe(
    switchMap(() => this.withTransfer("home_data", 
      this.api.get<HomeData>("/home").pipe(
        catchError(() => of(this.fallbackHomeData))
      )
    )),
    shareReplay(1)
  );

  readonly heroData$ = this.refreshSubject.pipe(
    switchMap(() => this.withTransfer("hero_data",
      this.api.get<any[]>("/home/hero").pipe(
        catchError(() => of([]))
      )
    )),
    shareReplay(1)
  );

  readonly newArrivalsData$ = this.refreshSubject.pipe(
    switchMap(() => this.withTransfer("new_arrivals_data",
      this.api.get<Product[]>("/home/products").pipe(
        catchError(() => of([]))
      )
    )),
    shareReplay(1)
  );

  readonly featuredProducts$ = this.refreshSubject.pipe(
    switchMap(() => this.api.get<Pagination<Product>>(this.baseUrl, {
      params: { isFeatured: true, pageSize: 12 }
    }).pipe(
      catchError(() => of({ data: [], count: 0 } as any))
    )),
    shareReplay(1)
  );

  private readonly fallbackHomeData: HomeData = {
    banners: [],
    categories: [],
    newArrivals: [],
    featuredProducts: []
  };

  private withTransfer<T>(keyString: string, apiObs: Observable<T>): Observable<T> {
    const key = makeStateKey<T>(keyString);
    const ssrData = this.transferState.get(key, null);
    
    if (ssrData) {
      if (isPlatformBrowser(this.platformId)) {
        this.transferState.remove(key);
      }
      return of(ssrData);
    }

    return apiObs.pipe(
      tap(data => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(key, data);
        }
      })
    );
  }

  refreshData(): void {
    this.cache.clear();
    this.refreshSubject.next();
  }

  getHomeData(context?: HttpContext): Observable<HomeData> {
    return this.homeData$;
  }

  getHeroData(context?: HttpContext): Observable<any[]> {
    return this.heroData$;
  }

  getNewArrivalsData(context?: HttpContext): Observable<Product[]> {
    return this.newArrivalsData$;
  }

  getProducts(
    params?: any,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    const paramKey = JSON.stringify(params || {});
    return this.withTransfer(`products_${paramKey}`,
      this.api.get<Pagination<Product>>(this.baseUrl, { params, context })
    );
  }

  getFeaturedProducts(
    limit = 10,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    return this.featuredProducts$;
  }

  getNewArrivals(
    limit = 10,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    return this.api.get<Pagination<Product>>(this.baseUrl, {
      params: { orderBy: "id", order: "desc", pageSize: limit },
      context,
    }).pipe(
      catchError(() => of({ data: [], count: 0 } as any)),
      shareReplay(1)
    );
  }

  getRelatedProducts(
    collectionId?: number,
    categoryId?: number,
    productGroupId?: number,
    limit = 4,
    searchTerm?: string,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    const params: any = { pageSize: limit };
    if (productGroupId) {
      params.productGroupId = productGroupId;
    } else if (collectionId) {
      params.collectionId = collectionId;
    } else if (categoryId) {
      params.categoryId = categoryId;
    }

    if (searchTerm) {
      params.searchTerm = searchTerm;
    }

    const cacheKey = `related_${JSON.stringify(params)}`;
    const cached = this.getCached<Pagination<Product>>(cacheKey);
    if (cached) return of(cached);
    
    return this.api.get<Pagination<Product>>(this.baseUrl, { params, context }).pipe(
      tap(data => this.setCache(cacheKey, data))
    );
  }


  getBySlug(slug: string, context?: HttpContext): Observable<Product> {
    const cacheKey = `product_slug_${slug}`;
    const cached = this.getCached<Product>(cacheKey);
    if (cached) return of(cached);

    return this.withTransfer(cacheKey, 
      this.api.get<Product>(`${this.baseUrl}/${slug}`, { context })
    ).pipe(
      tap(product => this.setCache(cacheKey, product))
    );
  }

  getReviewsByProductId(productId: number): Observable<Review[]> {
    const cacheKey = `reviews_product_${productId}`;
    const cached = this.getCached<Review[]>(cacheKey);
    if (cached) return of(cached);

    return this.api.get<Review[]>(`/reviews/products/${productId}`).pipe(
      tap(reviews => this.setCache(cacheKey, reviews))
    );
  }
}

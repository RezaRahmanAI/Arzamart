import { Injectable, inject } from "@angular/core";
import { HttpContext } from "@angular/common/http";
import { Observable, shareReplay, map, of, tap } from "rxjs";
import { catchError } from "rxjs/operators";
import { HomeData } from "../models/home-data";
import { ApiHttpClient } from "../http/http-client";
import { Product } from "../models/product";
import { Pagination } from "../models/pagination";
import { Review } from "../models/review";
import { CacheService } from "../cache/cache.service";

@Injectable({
  providedIn: "root",
})
export class ProductService {
  private readonly api = inject(ApiHttpClient);
  private readonly cache = inject(CacheService);
  private readonly baseUrl = "/products";

  private readonly fallbackHomeData: HomeData = {
    banners: [],
    categories: [],
    newArrivals: [],
    featuredProducts: []
  };

  getHomeData(context?: HttpContext): Observable<HomeData> {
    return this.cache.getOrFetch<HomeData>('homepage', 'home', () =>
      this.api.get<HomeData>("/home", { context }).pipe(
        catchError(() => of(this.fallbackHomeData))
      )
    ).pipe(
      map(result => result.data),
      shareReplay(1)
    );
  }

  getHeroData(context?: HttpContext): Observable<any[]> {
    return this.cache.getOrFetch<any[]>('banners', 'hero', () =>
      this.api.get<any[]>("/home/hero", { context }).pipe(
        catchError(() => of([]))
      )
    ).pipe(
      map(result => result.data),
      shareReplay(1)
    );
  }

  getNewArrivalsData(context?: HttpContext): Observable<Product[]> {
    return this.cache.getOrFetch<Product[]>('homepage', 'new-arrivals', () =>
      this.api.get<Product[]>("/home/products", { context }).pipe(
        catchError(() => of([]))
      )
    ).pipe(
      map(result => result.data),
      shareReplay(1)
    );
  }

  getProducts(params?: any, context?: HttpContext): Observable<Pagination<Product>> {
    const paramKey = JSON.stringify(params || {});
    return this.cache.getOrFetch<Pagination<Product>>('productDetails', `list_${paramKey}`, () =>
      this.api.get<Pagination<Product>>(this.baseUrl, { params, context })
    ).pipe(
      map(result => result.data)
    );
  }

  getFeaturedProducts(limit = 10, context?: HttpContext): Observable<Pagination<Product>> {
    return this.cache.getOrFetch<Pagination<Product>>('featuredProducts', 'all', () =>
      this.api.get<Pagination<Product>>(this.baseUrl, {
        params: { isFeatured: true, pageSize: limit },
        context,
      }).pipe(
        catchError(() => of({ data: [], count: 0 } as any))
      )
    ).pipe(
      map(result => result.data),
      shareReplay(1)
    );
  }

  getNewArrivals(limit = 10, context?: HttpContext): Observable<Pagination<Product>> {
    return this.cache.getOrFetch<Pagination<Product>>('homepage', `newArrivals_${limit}`, () =>
      this.api.get<Pagination<Product>>(this.baseUrl, {
        params: { orderBy: "id", order: "desc", pageSize: limit },
        context,
      }).pipe(
        catchError(() => of({ data: [], count: 0 } as any))
      )
    ).pipe(
      map(result => result.data),
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
    return this.cache.getOrFetch<Pagination<Product>>('productDetails', cacheKey, () =>
      this.api.get<Pagination<Product>>(this.baseUrl, { params, context })
    ).pipe(
      map(result => result.data)
    );
  }

  getBySlug(slug: string, context?: HttpContext): Observable<Product> {
    const cacheKey = `slug_${slug}`;
    return this.cache.getOrFetch<Product>('productDetails', cacheKey, () =>
      this.api.get<Product>(`${this.baseUrl}/${slug}`, { context })
    ).pipe(
      map(result => result.data)
    );
  }

  getReviewsByProductId(productId: number): Observable<Review[]> {
    const cacheKey = `product_${productId}`;
    return this.cache.getOrFetch<Review[]>('productReviews', cacheKey, () =>
      this.api.get<Review[]>(`/reviews/products/${productId}`)
    ).pipe(
      map(result => result.data)
    );
  }

  refreshData(): void {
    this.cache.clearStore('homepage');
    this.cache.clearStore('featuredProducts');
    this.cache.clearStore('trendingProducts');
    this.cache.clearStore('popularProducts');
    this.cache.clearStore('productDetails');
    this.cache.clearStore('productReviews');
  }
}

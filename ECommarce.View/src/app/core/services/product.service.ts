import { Injectable, inject, PLATFORM_ID, TransferState, makeStateKey } from "@angular/core";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { HttpContext } from "@angular/common/http";
import { Observable, of, shareReplay, BehaviorSubject, switchMap, tap } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { HomeData } from "../models/home-data";

import { ApiHttpClient } from "../http/http-client";
import { Product } from "../models/product";
import { Pagination } from "../models/pagination";
import { Review } from "../models/review";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class ProductService {
  private readonly api = inject(ApiHttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = "/products";
  private readonly adminBaseUrl = "/admin/products";

  private readonly refreshSubject = new BehaviorSubject<void>(void 0);

  // Reactive Data Streams
  readonly homeData$ = this.refreshSubject.pipe(
    switchMap(() => this.withTransfer("home_data", 
      this.api.get<HomeData>("/home").pipe(
        catchError(() => of(this.fallbackHomeData))
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
    this.refreshSubject.next();
  }

  getHomeData(context?: HttpContext): Observable<HomeData> {
    return this.homeData$;
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
    return this.api.get<Pagination<Product>>(this.baseUrl, { params, context });
  }

  getById(id: number, context?: HttpContext): Observable<Product> {
    return this.withTransfer(`product_id_${id}`, 
      this.api.get<Product>(`${this.baseUrl}/${id}`, { context })
    );
  }

  getBySlug(slug: string, context?: HttpContext): Observable<Product> {
    return this.withTransfer(`product_slug_${slug}`, 
      this.api.get<Product>(`${this.baseUrl}/${slug}`, { context })
    );
  }

  getReviewsByProductId(productId: number): Observable<Review[]> {
    return this.api.get<Review[]>(`/reviews/products/${productId}`);
  }

  getAdminProducts(): Observable<Product[]> {
    return this.api.get<Product[]>(this.adminBaseUrl);
  }

  getItemProducts(): Observable<Pagination<Product>> {
    return this.api.get<Pagination<Product>>(`${this.baseUrl}/items`);
  }
}

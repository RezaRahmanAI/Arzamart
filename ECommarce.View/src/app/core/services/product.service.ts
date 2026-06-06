import { Injectable, inject, PLATFORM_ID, TransferState, makeStateKey } from "@angular/core";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { HttpContext, HttpParams } from "@angular/common/http";
import { Observable, of, shareReplay, BehaviorSubject, switchMap, tap, map } from "rxjs";
import { catchError } from "rxjs/operators";
import { HomeData } from "../models/home-data";

import { ApiHttpClient } from "../http/http-client";
import { Product } from "../models/product";
import { Pagination } from "../models/pagination";
import { Review } from "../models/review";

import {
  AdminProduct,
  ProductCreatePayload,
  ProductUpdatePayload,
  ProductsQueryParams,
} from "../../admin/models/products.models";

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
    this.cache.clear();
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

  getById(id: number, context?: HttpContext): Observable<Product> {
    return this.withTransfer(`product_id_${id}`, 
      this.api.get<Product>(`${this.baseUrl}/${id}`, { context })
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

  getAdminProducts(): Observable<Product[]> {
    return this.api.get<Product[]>(this.adminBaseUrl);
  }

  getItemProducts(): Observable<Pagination<Product>> {
    return this.api.get<Pagination<Product>>(`${this.baseUrl}/items`);
  }

  // Admin-specific methods
  private readonly catalogSubject = new BehaviorSubject<AdminProduct[]>([]);
  private catalogLoaded = false;
  private catalogLoading = false;

  getCatalogProducts(): Observable<AdminProduct[]> {
    if (!this.catalogLoaded && !this.catalogLoading) {
      this.loadCatalog();
    }
    return this.catalogSubject.asObservable();
  }

  getCatalogSnapshot(): AdminProduct[] {
    return [...this.catalogSubject.getValue()];
  }

  getProductsAdmin(
    params: ProductsQueryParams,
  ): Observable<{ items: AdminProduct[]; total: number }> {
    const queryParams = new HttpParams({
      fromObject: {
        searchTerm: params.searchTerm,
        category: params.category,
        statusTab: params.statusTab,
        stockStatus: params.stockStatus ?? "all",
        page: params.page,
        pageSize: params.pageSize,
      },
    });
    return this.api.get<{ items: AdminProduct[]; total: number }>(
      this.adminBaseUrl,
      {
        params: queryParams,
      },
    );
  }

  getFilteredProducts(params: ProductsQueryParams): Observable<AdminProduct[]> {
    const queryParams = new HttpParams({
      fromObject: {
        searchTerm: params.searchTerm,
        category: params.category,
        statusTab: params.statusTab,
        stockStatus: params.stockStatus ?? "all",
      },
    });
    return this.api.get<AdminProduct[]>("/admin/products/filtered", {
      params: queryParams,
    });
  }

  exportProducts(params: ProductsQueryParams): Observable<string> {
    return this.getFilteredProducts(params).pipe(
      map((rows) => this.buildCsv(rows)),
    );
  }

  deleteProduct(productId: number): Observable<boolean> {
    return this.api.post<boolean>(`/admin/products/${productId}/delete`, {}).pipe(
      map((success) => {
        if (success) {
          this.updateCatalogSnapshot((products) =>
            products.filter((product) => product.id !== productId),
          );
        }
        return success;
      }),
    );
  }

  createProduct(payload: ProductCreatePayload): Observable<AdminProduct> {
    return this.api.post<AdminProduct>(this.adminBaseUrl, payload).pipe(
      map((created) => {
        this.updateCatalogSnapshot((products) => [created, ...products]);
        return created;
      }),
    );
  }

  getProductByIdAdmin(productId: number): Observable<AdminProduct> {
    return this.api.get<AdminProduct>(`/admin/products/${productId}`);
  }

  updateProduct(
    productId: number,
    payload: ProductUpdatePayload,
  ): Observable<AdminProduct> {
    return this.api.post<AdminProduct>(`/admin/products/${productId}`, payload).pipe(
      map((updated) => {
        this.updateCatalogSnapshot((products) => {
          const index = products.findIndex((item) => item.id === productId);
          if (index === -1) {
            return [updated, ...products];
          }
          return [
            ...products.slice(0, index),
            updated,
            ...products.slice(index + 1),
          ];
        });
        return updated;
      }),
    );
  }

  uploadProductMedia(files: File[]): Observable<string[]> {
    if (files.length === 0) {
      return of([]);
    }
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return this.api.post<string[]>("/admin/products/upload-media", formData);
  }

  getAvailableSizes(): Observable<string[]> {
    return this.api.get<string[]>("/admin/products/available-sizes");
  }

  searchProductsForCombo(term: string): Observable<any[]> {
    if (!term || term.length < 2) {
      return of([]);
    }
    const params = new HttpParams().set('q', term);
    return this.api.get<any[]>('/admin/products/search', { params });
  }

  removeProductMedia(productId: number, mediaUrl: string): Observable<boolean> {
    return this.api
      .post<boolean>(`/admin/products/${productId}/media/remove`, { mediaUrl })
      .pipe(
        map((success) => {
          if (success) {
            this.updateCatalogSnapshot((products) =>
              products.map((product) =>
                product.id === productId
                  ? this.removeMediaFromProduct(product, mediaUrl)
                  : product,
              ),
            );
          }
          return success;
        }),
      );
  }

  private loadCatalog(): void {
    this.catalogLoading = true;
    this.api.get<AdminProduct[]>("/admin/products/catalog").subscribe({
      next: (products) => {
        this.catalogLoaded = true;
        this.catalogSubject.next(products);
      },
      error: () => {
        this.catalogLoading = false;
      },
      complete: () => {
        this.catalogLoading = false;
      },
    });
  }

  private updateCatalogSnapshot(
    updater: (products: AdminProduct[]) => AdminProduct[],
  ): void {
    const current = this.catalogSubject.getValue();
    const next = updater(current);
    this.catalogLoaded = true;
    this.catalogSubject.next(next);
  }

  private buildCsv(rows: AdminProduct[]): string {
    const header = [
      "ID",
      "Name",
      "Category",
      "SKU",
      "Stock",
      "Price",
      "Purchase Rate",
      "Status",
    ];
    const csvRows = rows.map((product) => [
      product.id,
      product.name,
      product.categoryName,
      product.sku,
      String(product.stockQuantity),
      product.price.toFixed(2),
      (product.purchaseRate ?? 0).toFixed(2),
      product.isActive ? "Active" : "Inactive",
    ]);

    return [header, ...csvRows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
  }

  private removeMediaFromProduct(product: AdminProduct, mediaUrl: string): AdminProduct {
    const updatedImages = (product.images || []).filter(
      (img) => img.imageUrl !== mediaUrl,
    );
    const imageUrl =
      product.imageUrl === mediaUrl
        ? updatedImages[0]?.imageUrl || ""
        : product.imageUrl;

    return {
      ...product,
      images: updatedImages,
      imageUrl,
    };
  }

  private buildImagesFromMedia(
    mediaUrls: string[],
    name: string,
    existing?: any[],
  ): any[] {
    return mediaUrls.map((url, index) => {
      const existingImg = existing?.find((img) => img.imageUrl === url);
      return {
        id: existingImg?.id ?? 0,
        imageUrl: url,
        altText: existingImg?.altText ?? `${name} image ${index + 1}`,
        isPrimary: index === 0,
      };
    });
  }
}

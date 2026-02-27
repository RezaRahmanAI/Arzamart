import { Injectable, inject } from "@angular/core";
import { HttpContext } from "@angular/common/http";
import { Observable, of, shareReplay } from "rxjs";

import { ApiHttpClient } from "../http/http-client";
import { Product } from "../models/product";
import { Pagination } from "../models/pagination";
import { Review } from "../models/review";

@Injectable({
  providedIn: "root",
})
export class ProductService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/products";
  private readonly adminBaseUrl = "/admin/products";

  // Session-level caches for home page data
  private featuredCache$?: Observable<Pagination<Product>>;
  private newArrivalsCache$?: Observable<Pagination<Product>>;

  getProducts(
    params?: any,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    return this.api.get<Pagination<Product>>(this.baseUrl, { params, context });
  }

  getFeaturedProducts(
    limit = 10,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    if (!this.featuredCache$) {
      this.featuredCache$ = this.api.get<Pagination<Product>>(this.baseUrl, {
        params: { isFeatured: true, pageSize: limit },
        context,
      }).pipe(shareReplay(1));
    }
    return this.featuredCache$;
  }

  getNewArrivals(
    limit = 10,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    if (!this.newArrivalsCache$) {
      this.newArrivalsCache$ = this.api.get<Pagination<Product>>(this.baseUrl, {
        params: { orderBy: "id", order: "desc", pageSize: limit },
        context,
      }).pipe(shareReplay(1));
    }
    return this.newArrivalsCache$;
  }

  getRelatedProducts(
    collectionId?: number,
    categoryId?: number,
    limit = 4,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    const params: any = { pageSize: limit };
    if (collectionId) {
      params.collectionId = collectionId;
    } else if (categoryId) {
      params.categoryId = categoryId;
    }
    return this.api.get<Pagination<Product>>(this.baseUrl, { params, context });
  }

  getById(id: number, context?: HttpContext): Observable<Product> {
    return this.api.get<Product>(`${this.baseUrl}/${id}`, { context });
  }

  getBySlug(slug: string, context?: HttpContext): Observable<Product> {
    return this.api.get<Product>(`${this.baseUrl}/${slug}`, { context });
  }

  getReviewsByProductId(productId: number): Observable<Review[]> {
    return this.api.get<Review[]>(`/reviews/products/${productId}`);
  }

  getAdminProducts(): Observable<Product[]> {
    return this.api.get<Product[]>(this.adminBaseUrl);
  }
}

import { Injectable, inject } from "@angular/core";
import { HttpContext } from "@angular/common/http";
import { Observable, of, shareReplay } from "rxjs";
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
  private readonly baseUrl = "/products";
  private readonly adminBaseUrl = "/admin/products";

  // Session-level caches for home page data
  private featuredCache$?: Observable<Pagination<Product>>;
  private newArrivalsCache$?: Observable<Pagination<Product>>;
  private homeData$?: Observable<HomeData>;

  private readonly fallbackHomeData: HomeData = {
    banners: [
      {
        id: 1,
        title: "Summer Collection 2024",
        subtitle: "Up to 50% Off",
        imageUrl: "/assets/images/banners/summer.jpg",
        linkUrl: "/shop/summer",
        buttonText: "Shop Now",
        type: "Hero"
      },
      {
        id: 2,
        title: "New Arrivals",
        subtitle: "Fresh styles added daily",
        imageUrl: "/assets/images/banners/new-arrivals.jpg",
        linkUrl: "/products?sort=newest",
        buttonText: "Explore",
        type: "Banner"
      }
    ],
    categories: [
      { id: 1, name: "Men", slug: "men", imageUrl: "/assets/images/categories/men.jpg", displayOrder: 1, isActive: true, subCategories: [] },
      { id: 2, name: "Women", slug: "women", imageUrl: "/assets/images/categories/women.jpg", displayOrder: 2, isActive: true, subCategories: [] },
      { id: 3, name: "Children", slug: "children", imageUrl: "/assets/images/categories/children.jpg", displayOrder: 3, isActive: true, subCategories: [] },
      { id: 4, name: "Accessories", slug: "accessories", imageUrl: "/assets/images/categories/accessories.jpg", displayOrder: 4, isActive: true, subCategories: [] }
    ],
    newArrivals: [],
    featuredProducts: []
  };

  getHomeData(context?: HttpContext): Observable<HomeData> {
    if (!this.homeData$) {
      this.homeData$ = this.api
        .get<HomeData>("/home", { context })
        .pipe(
          catchError(() => {
            if (environment.useMockData) {
              return of(this.fallbackHomeData);
            }
            return of(this.fallbackHomeData);
          }),
          shareReplay(1)
        );
    }
    return this.homeData$;
  }

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
      this.featuredCache$ = this.api
        .get<Pagination<Product>>(this.baseUrl, {
          params: { isFeatured: true, pageSize: limit },
          context,
        })
        .pipe(
          catchError(() => of({ data: [], count: 0, pageIndex: 1, pageSize: limit, totalPages: 0 } as Pagination<Product>)),
          shareReplay(1)
        );
    }
    return this.featuredCache$;
  }

  getNewArrivals(
    limit = 10,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    if (!this.newArrivalsCache$) {
      this.newArrivalsCache$ = this.api
        .get<Pagination<Product>>(this.baseUrl, {
          params: { orderBy: "id", order: "desc", pageSize: limit },
          context,
        })
        .pipe(
          catchError(() => of({ data: [], count: 0, pageIndex: 1, pageSize: limit, totalPages: 0 } as Pagination<Product>)),
          shareReplay(1)
        );
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

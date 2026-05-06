import { Injectable, inject } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { BehaviorSubject, Observable, map, of } from "rxjs";

import {
  Product as StoreProduct,
  ProductImage,
} from "../../core/models/product";
import {
  AdminProduct as Product,
  ProductCreatePayload,
  ProductUpdatePayload,
  ProductsQueryParams,
} from "../models/products.models";
import { ApiHttpClient } from "../../core/http/http-client";

@Injectable({ providedIn: "root" })
export class ProductsService {
  private readonly api = inject(ApiHttpClient);
  private readonly catalogSubject = new BehaviorSubject<Product[]>([]);
  private catalogLoaded = false;
  private catalogLoading = false;

  constructor() {
    // Catalog is loaded lazily when first requested via getCatalogProducts()
  }

  getCatalogProducts(): Observable<Product[]> {
    if (!this.catalogLoaded && !this.catalogLoading) {
      this.loadCatalog();
    }
    return this.catalogSubject.asObservable();
  }

  getCatalogSnapshot(): Product[] {
    return [...this.catalogSubject.getValue()];
  }

  getProducts(
    params: ProductsQueryParams,
  ): Observable<{ items: Product[]; total: number }> {
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
    return this.api.get<{ items: Product[]; total: number }>(
      "/admin/products",
      {
        params: queryParams,
      },
    );
  }

  getFilteredProducts(params: ProductsQueryParams): Observable<Product[]> {
    const queryParams = new HttpParams({
      fromObject: {
        searchTerm: params.searchTerm,
        category: params.category,
        statusTab: params.statusTab,
        stockStatus: params.stockStatus ?? "all",
      },
    });
    return this.api.get<Product[]>("/admin/products/filtered", {
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

  createProduct(payload: ProductCreatePayload): Observable<Product> {
    return this.api.post<Product>("/admin/products", payload).pipe(
      map((created) => {
        this.updateCatalogSnapshot((products) => [created, ...products]);
        return created;
      }),
    );
  }

  getProductById(productId: number): Observable<Product> {
    return this.api.get<Product>(`/admin/products/${productId}`);
  }

  updateProduct(
    productId: number,
    payload: ProductUpdatePayload,
  ): Observable<Product> {
    return this.api.post<Product>(`/admin/products/${productId}`, payload).pipe(
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

  /**
   * Lightweight product search for combo bundle selection.
   * Returns minimal product data with variant info.
   */
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
    this.api.get<Product[]>("/admin/products/catalog").subscribe({
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
    updater: (products: Product[]) => Product[],
  ): void {
    const current = this.catalogSubject.getValue();
    const next = updater(current);
    this.catalogLoaded = true;
    this.catalogSubject.next(next);
  }

  private buildCsv(rows: Product[]): string {
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

  private removeMediaFromProduct(product: Product, mediaUrl: string): Product {
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
    existing?: ProductImage[],
  ): ProductImage[] {
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

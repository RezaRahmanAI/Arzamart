import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface VariantInventoryDto {
  variantId: number;
  sku: string;
  size: string;
  stockQuantity: number;
  price?: number;
  compareAtPrice?: number;
  purchaseRate?: number;
}

export interface ProductInventoryDto {
  productId: number;
  productName: string;
  productSku: string;
  productSlug: string;
  imageUrl: string;
  totalStock: number;
  stockQuantity: number;
  price?: number;
  compareAtPrice?: number;
  purchaseRate?: number;
  variants: VariantInventoryDto[];
}

@Injectable({
  providedIn: "root",
})
export class InventoryService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/products/inventory";

  getInventory(): Observable<ProductInventoryDto[]> {
    return this.api.get<ProductInventoryDto[]>(this.baseUrl);
  }

  updateStock(productId: number, data: { quantity: number; price?: number; compareAtPrice?: number; purchaseRate?: number }): Observable<any> {
    return this.api.post(`${this.baseUrl}/product/${productId}`, data);
  }

  updateVariantStock(variantId: number, data: { quantity: number; price?: number; compareAtPrice?: number; purchaseRate?: number }): Observable<any> {
    return this.api.post(`${this.baseUrl}/${variantId}`, data);
  }
}

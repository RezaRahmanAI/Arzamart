import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface VariantInventoryDto {
  variantId: number;
  sku: string;
  size: string;
  stockQuantity: number;
}

export interface ProductInventoryDto {
  productId: number;
  productName: string;
  productSku: string;
  imageUrl: string;
  totalStock: number;
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

  updateStock(variantId: number, quantity: number): Observable<any> {
    return this.api.post(`${this.baseUrl}/${variantId}`, { quantity });
  }
}

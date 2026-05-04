import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";
import { Product } from "../../core/models/product";

export interface ProductGroup {
  id: number;
  name: string;
  description?: string;
  products?: Product[];
}

@Injectable({
  providedIn: "root",
})
export class ProductGroupsService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/product-groups";

  getAll(): Observable<ProductGroup[]> {
    return this.api.get<ProductGroup[]>(this.baseUrl);
  }

  getById(id: number): Observable<ProductGroup> {
    return this.api.get<ProductGroup>(`${this.baseUrl}/${id}`);
  }

  create(group: Partial<ProductGroup>): Observable<ProductGroup> {
    return this.api.post<ProductGroup>(this.baseUrl, group);
  }

  update(id: number, group: Partial<ProductGroup>): Observable<void> {
    return this.api.put<void>(`${this.baseUrl}/${id}`, group);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }

  addProductToGroup(groupId: number, productId: number): Observable<void> {
    return this.api.post<void>(`${this.baseUrl}/${groupId}/products/${productId}`, {});
  }

  removeProductFromGroup(groupId: number, productId: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${groupId}/products/${productId}`);
  }
}

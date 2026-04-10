import { HttpErrorResponse, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, catchError, of, throwError } from "rxjs";

import { ApiHttpClient } from "../http/http-client";

export interface CustomerLookupResponse {
  name: string;
  phone: string;
  address: string;
  city?: string;
  area?: string;
}

export interface OrderItemRequest {
  productId: number;
  quantity: number;
  color?: string;
  size?: string;
}

export interface CustomerOrderRequest {
  name: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  deliveryMethodId?: number;
  itemsCount: number;
  total: number;
  items: OrderItemRequest[];
  isPreOrder?: boolean;
}

export interface CustomerOrderResponse {
  id: number;
  orderNumber: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  subTotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  itemsCount: number;
  createdAt: string;
}

@Injectable({
  providedIn: "root",
})
export class CustomerOrderApiService {
  private readonly api = inject(ApiHttpClient);

  lookupCustomer(phone: string): Observable<CustomerLookupResponse | null> {
    const params = new HttpParams().set("phone", phone);
    return this.api
      .get<CustomerLookupResponse>("/customers/lookup", { params })
      .pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            return of(null);
          }
          return throwError(() => error);
        }),
      );
  }

  placeOrder(payload: CustomerOrderRequest): Observable<CustomerOrderResponse> {
    return this.api.post<CustomerOrderResponse>("/orders", payload);
  }
}

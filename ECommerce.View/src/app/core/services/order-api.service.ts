import { HttpErrorResponse, HttpParams, HttpHeaders } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, catchError, of, throwError } from "rxjs";

import { ApiHttpClient } from "../http/http-client";
import { StorageKeys } from "../constants/storage-keys";

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
  sourcePageId?: number | null;
  socialMediaSourceId?: number | null;
  discount?: number;
  advancePayment?: number;
  adminNote?: string;
  customerNote?: string;
}

export interface CustomerOrderResponse {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  area: string;
  subTotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  itemsCount: number;
  createdAt: string;
}

@Injectable({ providedIn: "root" })
export class OrderApiService {
  private readonly api = inject(ApiHttpClient);

  lookupCustomer(phone: string): Observable<CustomerLookupResponse | null> {
    if (!phone || !phone.trim()) {
      return of(null);
    }
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
    const sessionId = localStorage.getItem(StorageKeys.CART_SESSION_ID);
    const options = sessionId
      ? { headers: new HttpHeaders().set("X-Session-Id", sessionId) }
      : {};
    return this.api.post<CustomerOrderResponse>("/orders", payload, options);
  }
}

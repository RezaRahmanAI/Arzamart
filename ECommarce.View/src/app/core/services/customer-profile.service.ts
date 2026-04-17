import { Injectable, inject } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { BehaviorSubject, Observable, map, tap } from "rxjs";
import { Order, OrderStatus } from "../models/order";
import { ApiHttpClient } from "../http/http-client";

export interface CustomerProfile {
  id: number;
  phone: string;
  name: string;
  address: string;
  createdAt: string;
}

export interface CustomerProfileRequest {
  phone: string;
  name: string;
  address: string;
}

@Injectable({
  providedIn: "root",
})
export class CustomerProfileService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/customers";
  private readonly storageKey = "customer_phone";

  private readonly phoneSubject = new BehaviorSubject<string | null>(
    this.getStoredPhone(),
  );
  readonly phone$ = this.phoneSubject.asObservable();

  getStoredPhone(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  storePhone(phone: string): void {
    localStorage.setItem(this.storageKey, phone);
    this.phoneSubject.next(phone);
  }

  clearPhone(): void {
    localStorage.removeItem(this.storageKey);
    this.phoneSubject.next(null);
  }

  getProfile(phone: string): Observable<CustomerProfile> {
    const params = new HttpParams().set("phone", phone);
    return this.api.get<CustomerProfile>(`${this.baseUrl}/lookup`, { params });
  }

  updateProfile(request: CustomerProfileRequest): Observable<CustomerProfile> {
    return this.api
      .post<CustomerProfile>(`${this.baseUrl}/profile`, request)
      .pipe(
        tap((profile) => {
          if (profile.phone) {
            this.storePhone(profile.phone);
          }
        }),
      );
  }

  getOrders(phone: string): Observable<Order[]> {
    const params = new HttpParams().set("phone", phone);
    return this.api
      .get<any[]>(`${this.baseUrl}/orders`, { params })
      .pipe(map((dtos) => dtos.map(this.mapOrderDtoToOrder)));
  }

  private mapOrderDtoToOrder(dto: any): Order {
    return {
      id: dto.id,
      orderNumber: dto.orderNumber,
      customerName: dto.customerName || dto.name,
      customerPhone: dto.customerPhone || dto.phone,
      shippingAddress: dto.shippingAddress || dto.address,
      subTotal: dto.subTotal || dto.total || 0,
      tax: dto.tax || 0,
      shippingCost: dto.shippingCost || 0,
      total: dto.total || 0,
      itemsCount:
        dto.itemsCount ||
        (dto.items || []).reduce(
          (sum: number, i: any) => sum + (i.quantity || 0),
          0,
        ),
      status: dto.status as OrderStatus,
      createdAt: dto.createdAt,
      items: (dto.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName || item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.price || 0,
        totalPrice:
          item.totalPrice ||
          (item.unitPrice || item.price || 0) * item.quantity ||
          0,
        size: item.size,
        imageUrl: item.imageUrl || "",
      })),
    };
  }
}

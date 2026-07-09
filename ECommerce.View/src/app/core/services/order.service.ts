import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, map, tap, throwError } from "rxjs";

import { CartItem, CartSummary } from "../models/cart";
import { CheckoutState } from "../models/checkout";
import { Order, OrderItem, OrderStatus } from "../models/order";
import { OrderApiService, OrderItemRequest, CustomerOrderRequest, CustomerOrderResponse } from "./order-api.service";
import { CartService } from "./cart.service";
import { StorageKeys } from "../constants/storage-keys";

interface PlaceOrderPayload {
  state: CheckoutState;
  cartItems: CartItem[];
  summary: CartSummary;
  deliveryMethodId?: number;
  isPreOrder?: boolean;
  sourcePageId?: number | null;
  socialMediaSourceId?: number | null;
  discount?: number;
  advancePayment?: number;
  adminNote?: string;
  customerNote?: string;
}

@Injectable({ providedIn: "root" })
export class OrderService {
  private readonly orderApi = inject(OrderApiService);
  private readonly cartService = inject(CartService);
  private readonly ordersSubject = new BehaviorSubject<Order[]>(
    this.loadOrders(),
  );
  readonly orders$ = this.ordersSubject.asObservable();

  getOrderById(orderId: number): Observable<Order | undefined> {
    return this.orders$.pipe(
      map((orders) => orders.find((order) => order.id === orderId)),
    );
  }

  placeOrder(payload: PlaceOrderPayload): Observable<Order> {
    if (!payload.cartItems || payload.cartItems.length === 0) {
      return throwError(() => new Error("Cannot place order with empty cart"));
    }

    const items: OrderItem[] = payload.cartItems.map((item) => ({
      productId: Number(item.productId),
      productName: item.name,
      unitPrice: item.price,
      quantity: item.quantity,
      size: item.size,
      imageUrl: item.imageUrl,
      totalPrice: item.price * item.quantity,
    }));

    const apiItems: OrderItemRequest[] = payload.cartItems.map((item) => ({
      productId: Number(item.productId),
      quantity: item.quantity,
      color: item.color,
      size: item.size,
    }));

    const request: CustomerOrderRequest = {
      name: payload.state.fullName,
      phone: payload.state.phone,
      address: payload.state.address,
      city: payload.state.city ?? "",
      area: payload.state.area ?? "",
      divisionId: payload.state.divisionId,
      districtId: payload.state.districtId,
      upazilaId: payload.state.upazilaId,
      deliveryMethodId: payload.deliveryMethodId ?? payload.state.deliveryMethodId,
      itemsCount: payload.summary.itemsCount,
      total: payload.summary.total,
      items: apiItems,
      isPreOrder: payload.isPreOrder ?? false,
      sourcePageId: payload.sourcePageId ?? null,
      socialMediaSourceId: payload.socialMediaSourceId ?? null,
      discount: payload.discount ?? 0,
      advancePayment: payload.advancePayment ?? 0,
      adminNote: payload.adminNote,
      customerNote: payload.customerNote,
    };

    return this.orderApi.placeOrder(request).pipe(
      map((response) => this.mapResponseToOrder(response, items, payload.summary)),
      tap((order) => this.addOrderToHistory(order)),
    );
  }

  private mapResponseToOrder(
    response: CustomerOrderResponse,
    items: OrderItem[],
    summary: CartSummary,
  ): Order {
    return {
      id: response.id,
      orderNumber: response.orderNumber || `ORD-${response.id}`,
      status: OrderStatus.Confirmed,
      items,
      customerName: response.customerName,
      customerPhone: response.customerPhone,
      shippingAddress: response.shippingAddress,
      subTotal: response.subTotal ?? summary.subtotal,
      shippingCost: response.shippingCost ?? summary.shipping,
      tax: response.tax ?? summary.tax,
      total: response.total ?? summary.total,
      itemsCount: response.itemsCount ?? summary.itemsCount,
      createdAt: response.createdAt ?? new Date().toISOString(),
    };
  }

  addOrderToHistory(order: Order): void {
    const currentOrders = this.ordersSubject.getValue();
    this.ordersSubject.next([order, ...currentOrders]);
    this.persistOrders();
  }

  buildAndSaveOrder(
    response: CustomerOrderResponse,
    items: OrderItem[],
    total: number,
    shippingCost: number,
    tax: number,
  ): void {
    const order: Order = {
      id: response.id,
      orderNumber: response.orderNumber || `ORD-${response.id}`,
      status: OrderStatus.Confirmed,
      items,
      customerName: response.customerName,
      customerPhone: response.customerPhone,
      shippingAddress: response.shippingAddress,
      subTotal: response.subTotal ?? total - shippingCost - tax,
      shippingCost: response.shippingCost ?? shippingCost,
      tax: response.tax ?? tax,
      total: response.total ?? total,
      itemsCount: response.itemsCount ?? items.length,
      createdAt: response.createdAt ?? new Date().toISOString(),
    };
    this.addOrderToHistory(order);
  }

  private loadOrders(): Order[] {
    const stored = localStorage.getItem(StorageKeys.ORDERS);
    if (stored) {
      try {
        return JSON.parse(stored) as Order[];
      } catch {
        return [];
      }
    }
    return [];
  }

  private persistOrders(): void {
    localStorage.setItem(
      StorageKeys.ORDERS,
      JSON.stringify(this.ordersSubject.getValue()),
    );
  }
}

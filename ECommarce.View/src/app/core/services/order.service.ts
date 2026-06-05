import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, map, tap, throwError } from "rxjs";


import { CartItem, CartSummary } from "../models/cart";
import { CheckoutState } from "../models/checkout";
import { Order, OrderItem, OrderStatus } from "../models/order";
import {
  CustomerOrderApiService,
  CustomerOrderResponse,
} from "./customer-order-api.service";
import { CartService } from "./cart.service";

interface PlaceOrderPayload {
  state: CheckoutState;
  cartItems: CartItem[];
  summary: CartSummary;
  deliveryMethodId?: number;
}

@Injectable({
  providedIn: "root",
})
export class OrderService {
  private readonly customerOrderApi = inject(CustomerOrderApiService);
  private readonly cartService = inject(CartService);
  private readonly storageKey = "orders";
  private readonly ordersSubject = new BehaviorSubject<Order[]>(
    this.loadOrders(),
  );
  readonly orders$ = this.ordersSubject.asObservable();

  getOrderById(orderId: number): Observable<Order | undefined> {
    return this.orders$.pipe(
      map((orders) => orders.find((order) => order.id === orderId)),
    );
  }

  getFallbackOrder(): Order {
    return this.ordersSubject.getValue()[0];
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

    return this.customerOrderApi
      .placeOrder({
        name: payload.state.fullName,
        phone: payload.state.phone,
        address: payload.state.address,
        city: payload.state.city ?? "",
        area: payload.state.area ?? "",
        deliveryMethodId: payload.deliveryMethodId,
        itemsCount: payload.summary.itemsCount,
        total: payload.summary.total,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
        })),
      })
      .pipe(
        map((response) => this.buildOrder(response, items, payload.summary)),
        tap((order) => {
          this.addOrderToHistory(order);
        }),
      );
  }

  addOrderToHistory(order: Order): void {
    const currentOrders = this.ordersSubject.getValue();
    this.ordersSubject.next([order, ...currentOrders]);
    this.persistOrders();
  }

  buildAndSaveOrder(
    response: CustomerOrderResponse,
    items: OrderItem[],
    subTotal: number,
    shippingCost: number,
    tax: number,
  ): Order {
    const order: Order = {
      id: response.id,
      orderNumber: response.orderNumber || `ORD-${response.id}`,
      status: OrderStatus.Confirmed,
      items,
      customerName: response.customerName,
      customerPhone: response.customerPhone,
      shippingAddress: response.shippingAddress,
      subTotal,
      shippingCost,
      tax,
      total: response.total,
      itemsCount: response.itemsCount,
      createdAt: response.createdAt,
    };
    this.addOrderToHistory(order);
    return order;
  }

  private loadOrders(): Order[] {
    const stored = localStorage.getItem(this.storageKey);
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
      this.storageKey,
      JSON.stringify(this.ordersSubject.getValue()),
    );
  }

  private buildOrder(
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
      subTotal: response.subTotal || summary.subtotal,
      shippingCost: response.shippingCost ?? summary.shipping,
      tax: response.tax ?? summary.tax,
      total: response.total || summary.total,
      itemsCount: response.itemsCount || summary.itemsCount,
      createdAt: response.createdAt || new Date().toISOString(),
    };
  }
}

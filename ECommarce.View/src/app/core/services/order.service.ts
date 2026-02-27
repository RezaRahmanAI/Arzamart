import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, map, tap } from "rxjs";

import { MOCK_ORDERS } from "../data/mock-orders";
import { CartItem, CartSummary } from "../models/cart";
import { CheckoutState } from "../models/checkout";
import { Order, OrderItem, OrderStatus } from "../models/order";
import {
  CustomerOrderApiService,
  CustomerOrderResponse,
} from "./customer-order-api.service";

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
    const items: OrderItem[] = payload.cartItems.map((item) => ({
      productId: Number(item.productId),
      productName: item.name,
      unitPrice: item.price,
      quantity: item.quantity,
      color: item.color,
      size: item.size,
      imageUrl: item.imageUrl,
      totalPrice: item.price * item.quantity,
    }));

    return this.customerOrderApi
      .placeOrder({
        name: payload.state.fullName,
        phone: payload.state.phone,
        address: payload.state.address,
        deliveryMethodId: payload.deliveryMethodId,
        itemsCount: payload.summary.itemsCount,
        total: payload.summary.total,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          color: i.color,
          size: i.size,
        })),
      })
      .pipe(
        map((response) => this.buildOrder(response, items, payload.summary)),
        tap((order) => this.addOrderToHistory(order)),
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
      id: response.orderId,
      orderNumber: `ORD-${response.orderId}`,
      status: OrderStatus.Confirmed,
      items,
      customerName: response.name,
      customerPhone: response.phone,
      shippingAddress: response.address,
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
        return [...MOCK_ORDERS];
      }
    }

    return [...MOCK_ORDERS];
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
      id: response.orderId,
      orderNumber: `ORD-${response.orderId}`,
      status: OrderStatus.Confirmed,
      items,
      customerName: response.name,
      customerPhone: response.phone,
      shippingAddress: response.address,
      subTotal: summary.subtotal,
      shippingCost: summary.shipping,
      tax: summary.tax,
      total: summary.total,
      itemsCount: summary.itemsCount,
      createdAt: new Date().toISOString(),
    };
  }
}

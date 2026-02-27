import { Injectable, inject } from "@angular/core";
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  tap,
  debounceTime,
  switchMap,
  filter,
} from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { CartItem, CartSummary } from "../models/cart";
import { Product } from "../models/product";
import { SettingsService } from "../../admin/services/settings.service";
import { AnalyticsService } from "./analytics.service";
import { environment } from "../../../environments/environment";
import {
  CartDto,
  AddToCartDto,
  UpdateCartItemDto,
} from "../models/cart-dto.model";
import { v4 as uuidv4 } from "uuid";

@Injectable({
  providedIn: "root",
})
export class CartService {
  private freeShippingThreshold = 0;
  private shippingCharge = 0;
  private readonly taxRate = 0;
  private readonly sessionIdKey = "cart_session_id";
  private readonly apiUrl = `${environment.apiBaseUrl}/Cart`;

  private readonly settingsService = inject(SettingsService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly http = inject(HttpClient);

  private readonly cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly cartItems$ = this.cartItemsSubject.asObservable();

  readonly summary$ = this.cartItems$.pipe(
    map((items) => this.calculateSummary(items)),
  );

  private readonly qtyUpdateSubject = new BehaviorSubject<{
    id: string;
    qty: number;
  } | null>(null);

  constructor() {
    // Subscribe to settings updates
    this.settingsService.settings$.subscribe((settings: any) => {
      if (settings) {
        this.freeShippingThreshold = settings.freeShippingThreshold || 0;
        this.shippingCharge = 0;
        this.cartItemsSubject.next(this.cartItemsSubject.getValue());
      }
    });

    this.settingsService.getSettings().subscribe();

    // Initial load from server
    this.refreshCartFromServer();

    // Setup debounced qty updates
    this.qtyUpdateSubject
      .pipe(
        filter((update) => update !== null),
        debounceTime(500),
        switchMap((update) => {
          const numericId = parseInt(update!.id, 10);
          return this.http
            .put<CartDto>(
              `${this.apiUrl}/items/${numericId}`,
              { quantity: update!.qty },
              { headers: this.headers },
            )
            .pipe(
              catchError((err) => {
                console.error(
                  "Failed to sync qty with server, refreshing cart",
                  err,
                );
                this.refreshCartFromServer(); // Re-sync if failed
                return of(null);
              }),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((dto) => {
        if (dto) this.updateLocalState(dto);
      });
  }

  getSessionId(): string {
    let sessionId = localStorage.getItem(this.sessionIdKey);
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem(this.sessionIdKey, sessionId);
    }
    return sessionId;
  }

  private get headers() {
    return new HttpHeaders().set("X-Session-Id", this.getSessionId());
  }

  refreshCartFromServer(): void {
    this.http
      .get<CartDto>(this.apiUrl, { headers: this.headers })
      .pipe(catchError(() => of(null)))
      .subscribe((dto) => {
        if (dto) this.updateLocalState(dto);
      });
  }

  getCart(): Observable<CartItem[]> {
    return this.cartItems$;
  }

  getCartSnapshot(): CartItem[] {
    return this.cartItemsSubject.getValue();
  }

  getSummarySnapshot(): CartSummary {
    return this.calculateSummary(this.cartItemsSubject.getValue());
  }

  addItem(
    product: Product,
    quantity = 1,
    color?: string,
    size?: string,
  ): Observable<CartDto> {
    const resolvedColor =
      color ?? product.images?.find((i) => !!i.color)?.color ?? "Default";
    const resolvedSize = size ?? product.variants[0]?.size ?? "One Size";

    const payload: AddToCartDto = {
      productId: product.id,
      quantity,
      color: resolvedColor,
      size: resolvedSize,
    };

    return this.http
      .post<CartDto>(`${this.apiUrl}/items`, payload, { headers: this.headers })
      .pipe(
        tap((dto) => {
          this.updateLocalState(dto);
          // Analytics requires CartItem structure
          const newItem = this.cartItemsSubject
            .getValue()
            .find(
              (i) =>
                i.productId === payload.productId &&
                i.color === payload.color &&
                i.size === payload.size,
            );
          if (newItem) {
            this.analyticsService.trackAddToCart(newItem);
          }
        }),
        catchError((err) => {
          console.error("Failed to add item to cart", err);
          throw err;
        }),
      );
  }

  removeItem(cartItemId: string): void {
    // Backend uses numeric ID for cart items
    const numericId = parseInt(cartItemId, 10);
    if (isNaN(numericId)) return;

    this.http
      .delete<CartDto>(`${this.apiUrl}/items/${numericId}`, {
        headers: this.headers,
      })
      .subscribe({
        next: (dto) => this.updateLocalState(dto),
        error: (err) => console.error("Failed to remove item", err),
      });
  }

  updateQty(cartItemId: string, quantity: number): void {
    const sanitizedQty = Math.max(1, quantity);
    const currentItems = this.cartItemsSubject.getValue();
    const itemIndex = currentItems.findIndex((i) => i.id === cartItemId);

    if (itemIndex !== -1) {
      // 1. Optimistic UI update
      const updatedItems = [...currentItems];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity: sanitizedQty,
      };
      this.cartItemsSubject.next(updatedItems);

      // 2. Schedule server sync
      this.qtyUpdateSubject.next({ id: cartItemId, qty: sanitizedQty });
    }
  }

  clearCart(): void {
    this.cartItemsSubject.next([]);
    // Depending on backend implementation, this might need an API endpoint
    // to clear the whole cart. For now, we clear the UI.
    // Actual DB clearing should likely be a DELETE /api/cart
  }

  mergeGuestCart(): Observable<CartDto | null> {
    const sessionId = localStorage.getItem(this.sessionIdKey);
    if (!sessionId) return of(null);

    // Auth token is handled by the auth interceptor automatically
    return this.http
      .post<CartDto>(`${this.apiUrl}/merge?sessionId=${sessionId}`, {})
      .pipe(
        tap((dto) => {
          if (dto) {
            this.updateLocalState(dto);
            // Don't remove the sessionId from localstorage here, because if they log out
            // they need a fresh guest cart, so keeping the session ID is fine as it will
            // just act as a new anonymous cart once logged out.
          }
        }),
        catchError((err) => {
          console.error("Failed to merge guest cart", err);
          return of(null);
        }),
      );
  }

  private updateLocalState(dto: CartDto): void {
    const mappedItems: CartItem[] = dto.items.map((i) => ({
      id: i.id.toString(), // Map backend numeric ID to string ID used in frontend UI
      productId: i.productId,
      name: i.productName,
      price: i.salePrice ?? i.price, // Use sale price if available
      quantity: i.quantity,
      color: i.color,
      size: i.size,
      imageUrl: i.imageUrl,
      imageAlt: i.productName, // Basic fallback
    }));

    this.cartItemsSubject.next(mappedItems);
  }

  private calculateSummary(items: CartItem[]): CartSummary {
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const tax = Number((subtotal * this.taxRate).toFixed(2));
    const shipping =
      subtotal >= this.freeShippingThreshold ? 0 : this.shippingCharge;
    const total = Number((subtotal + tax + shipping).toFixed(2));
    const freeShippingRemaining = Math.max(
      this.freeShippingThreshold - subtotal,
      0,
    );
    const freeShippingProgress = Math.min(
      (subtotal / this.freeShippingThreshold) * 100,
      100,
    );
    const itemsCount = items.reduce((total, item) => total + item.quantity, 0);

    return {
      itemsCount,
      subtotal,
      tax,
      shipping,
      total,
      freeShippingThreshold: this.freeShippingThreshold,
      freeShippingRemaining,
      freeShippingProgress,
    };
  }
}

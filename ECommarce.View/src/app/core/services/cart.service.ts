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
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { CartItem, CartSummary } from "../models/cart";
import { Product } from "../models/product";
import { SettingsService } from "../../admin/services/settings.service";
import { AnalyticsService } from "./analytics.service";
import {
  CartDto,
  AddToCartDto,
  UpdateCartItemDto,
} from "../models/cart-dto.model";
import { NotificationService } from "./notification.service";
import { v4 as uuidv4 } from "uuid";
import { ApiHttpClient } from "../http/http-client";

@Injectable({
  providedIn: "root",
})
export class CartService {
  private freeShippingThreshold = 0;
  private shippingCharge = 0;
  private readonly taxRate = 0;
  private readonly sessionIdKey = "cart_session_id";
  private readonly apiUrl = `/Cart`;

  private readonly settingsService = inject(SettingsService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly notificationService = inject(NotificationService);
  private readonly api = inject(ApiHttpClient);

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
          return this.api
            .put<CartDto>(
              `${this.apiUrl}/items/${numericId}`,
              { quantity: update!.qty },
              this.options,
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
    // Explicitly reject invalid strings that might be stored accidentally
    if (
      !sessionId ||
      sessionId === "null" ||
      sessionId === "undefined" ||
      sessionId.trim() === "" ||
      sessionId.length < 10
    ) {
      sessionId = uuidv4();
      localStorage.setItem(this.sessionIdKey, sessionId);
    }
    return sessionId;
  }

  private get options() {
    return {
      headers: new HttpHeaders().set("X-Session-Id", this.getSessionId()),
    };
  }

  refreshCartFromServer(): void {
    const sessionId = this.getSessionId();
    const params = new HttpParams().set("sid", sessionId); // Add sid to URL to bypass potential CDN/Proxy shared caching
    
    this.api
      .get<CartDto>(this.apiUrl, { ...this.options, params })
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
    size?: string,
  ): Observable<CartDto> {
    const hasVariants = product.variants && product.variants.length > 0;
    const resolvedSize = 
      size && size.trim() !== ""
        ? size
        : (hasVariants ? undefined : "One Size");

    if (hasVariants && !resolvedSize) {
      throw new Error("Size is required for this product.");
    }

    const payload: AddToCartDto = {
      productId: product.id,
      quantity,
      size: resolvedSize ?? "One Size",
    };

    return this.api
      .post<CartDto>(`${this.apiUrl}/items`, payload, this.options)
      .pipe(
        tap((dto) => {
          this.updateLocalState(dto);
          // Analytics requires CartItem structure
          const newItem = this.cartItemsSubject
            .getValue()
            .find(
              (i) =>
                i.productId === payload.productId &&
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

    // 1. Optimistic UI update
    const currentItems = this.cartItemsSubject.getValue();
    const updatedItems = currentItems.filter((i) => i.id !== cartItemId);
    this.cartItemsSubject.next(updatedItems);

    // 2. Perform backend deletion
    // ApiHttpClient.delete automatically converts to POST /delete
    this.api
      .delete<CartDto>(`${this.apiUrl}/items/${numericId}`, this.options)
      .subscribe({
        next: (dto) => this.updateLocalState(dto),
        error: (err) => {
          console.error("Failed to remove item", err);
          this.refreshCartFromServer(); // Re-sync to revert local state on failure
        },
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

  clearCart(): Observable<any> {
    // Perform backend deletion
    return this.api.delete(this.apiUrl, this.options).pipe(
      tap(() => {
        this.cartItemsSubject.next([]);
      }),
      catchError((err) => {
        console.error("Failed to clear cart on server", err);
        this.refreshCartFromServer(); // Re-sync if failed
        throw err;
      }),
    );
  }

  mergeGuestCart(): Observable<CartDto | null> {
    const sessionId = localStorage.getItem(this.sessionIdKey);
    if (!sessionId) return of(null);

    // Auth token is handled by the auth interceptor automatically
    return this.api
      .post<CartDto>(
        `${this.apiUrl}/merge`,
        {},
        { ...this.options, params: { sessionId } },
      )
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
      price: i.price,
      quantity: i.quantity,
      size: i.size,
      imageUrl: i.imageUrl,
      imageAlt: i.productName, // Basic fallback
      discountPercentage: i.salePrice ? Math.round(((i.salePrice - i.price) / i.salePrice) * 100) : 0,
      compareAtPrice: i.salePrice,
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
    const discount = items.reduce((total, item) => {
      const originalPrice = item.compareAtPrice ?? item.price;
      return total + (originalPrice - item.price) * item.quantity;
    }, 0);

    return {
      itemsCount,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      freeShippingThreshold: this.freeShippingThreshold,
      freeShippingRemaining,
      freeShippingProgress,
    };
  }

  notifySizeRequired(): void {
    this.notificationService.error("Please select a size first");
  }
}

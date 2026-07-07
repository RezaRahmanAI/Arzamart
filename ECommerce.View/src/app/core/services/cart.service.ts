import { DestroyRef, Injectable, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
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
  finalize,
  EMPTY,
} from "rxjs";
import { HttpHeaders, HttpParams } from "@angular/common/http";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { CartItem, CartSummary } from "../models/cart";
import { Product } from "../models/product";
import { SiteSettingsService } from "./site-settings.service";
import { AnalyticsService } from "./analytics.service";
import {
  CartDto,
  AddToCartDto,
  UpdateCartItemDto,
} from "../models/cart-dto.model";
import { NotificationService } from "./notification.service";
import { ApiHttpClient } from "../http/http-client";
import { AppConstants } from "../constants/app.constants";
import { StorageKeys } from "../constants/storage-keys";
import { API_CONFIG, ApiConfig } from "../config/api.config";

@Injectable({
  providedIn: "root",
})
export class CartService {
  private freeShippingThreshold = 0;
  private shippingCharge = 0;
  private readonly taxRate = 0;
  private readonly sessionExpiryDays = AppConstants.GuestSessionExpiryDays;
  private readonly apiUrl = `/Cart`;

  private readonly settingsService = inject(SiteSettingsService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly notificationService = inject(NotificationService);
  private readonly api = inject(ApiHttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  private readonly cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly cartItems$ = this.cartItemsSubject.asObservable();

  readonly summary$ = this.cartItems$.pipe(
    map((items) => this.calculateSummary(items)),
  );

  /**
   * Global mutation lock prevents concurrent cart operations.
   * While true, all mutation methods (add/remove/update/clear) are blocked.
   */
  private _isCartUpdating = false;
  get isCartUpdating(): boolean {
    return this._isCartUpdating;
  }

  private readonly qtyUpdateSubject = new BehaviorSubject<{
    id: string;
    qty: number;
  } | null>(null);

  private readonly isDrawerOpenSubject = new BehaviorSubject<boolean>(false);
  readonly isDrawerOpen$ = this.isDrawerOpenSubject.asObservable();

  // Loading state: tracks which item IDs are currently being removed
  private readonly removingIdsSubject = new BehaviorSubject<Set<string>>(new Set());
  readonly removingIds$ = this.removingIdsSubject.asObservable();

  // Sliding out state: tracks items mid-animation (before DOM removal)
  private readonly slidingOutIdsSubject = new BehaviorSubject<Set<string>>(new Set());
  readonly slidingOutIds$ = this.slidingOutIdsSubject.asObservable();

  // Animation duration (ms) for slide-out
  private readonly SLIDE_OUT_MS = 300;

  // Tracks whether the initial server load has completed
  private initialLoadComplete = false;

  constructor() {
    // Subscribe to settings updates via public SiteSettingsService
    this.settingsService.getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((settings) => {
        if (settings) {
          this.freeShippingThreshold = settings.freeShippingThreshold || 0;
          this.shippingCharge = settings.shippingCharge || 0;
          this.cartItemsSubject.next(this.cartItemsSubject.getValue());
        }
      });

    // Initial load from server (only in browser — SSR has no session)
    if (isPlatformBrowser(this.platformId)) {
      this.refreshCartFromServer();
    }

    // Setup debounced qty updates
    this.qtyUpdateSubject
      .pipe(
        filter((update) => update !== null),
        debounceTime(500),
        switchMap((update) => {
          const numericId = parseInt(update!.id, 10);
          if (isNaN(numericId)) {
            return of(null);
          }
          this._isCartUpdating = true;
          return this.api
            .post<CartDto>(
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
              finalize(() => {
                this._isCartUpdating = false;
              }),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((dto) => {
        if (dto) this.applyServerState(dto);
      });
  }

  openDrawer(): void {
    this.isDrawerOpenSubject.next(true);
  }

  closeDrawer(): void {
    this.isDrawerOpenSubject.next(false);
  }

  getSessionId(): string {
    if (!isPlatformBrowser(this.platformId)) return "ssr-placeholder";
    let sessionId = localStorage.getItem(StorageKeys.CART_SESSION_ID);
    const sessionTimestamp = localStorage.getItem(StorageKeys.CART_SESSION_TIMESTAMP);
    const now = Date.now();
    const expiryMs = this.sessionExpiryDays * 24 * 60 * 60 * 1000;

    let isExpired = false;
    if (sessionTimestamp) {
      const startTime = parseInt(sessionTimestamp, 10);
      if (isNaN(startTime) || now - startTime > expiryMs) {
        isExpired = true;
      }
    }

    if (
      !sessionId ||
      sessionId === "null" ||
      sessionId === "undefined" ||
      sessionId.length < 10 ||
      isExpired
    ) {
      sessionId = crypto.randomUUID();
      this.saveSessionId(sessionId);
    } else {
      // Refresh timestamp on every active session access to extend life if active
      localStorage.setItem(StorageKeys.CART_SESSION_TIMESTAMP, now.toString());
    }

    return sessionId;
  }

  private saveSessionId(id: string): void {
    localStorage.setItem(StorageKeys.CART_SESSION_ID, id);
    localStorage.setItem(StorageKeys.CART_SESSION_TIMESTAMP, Date.now().toString());
  }

  private get options() {
    return {
      headers: new HttpHeaders().set("X-Session-Id", this.getSessionId()),
    };
  }

  /**
   * Fetches the cart from the server and REPLACES all local state.
   * Server is the single source of truth.
   * This is the ONLY method that should be used on app init / refresh.
   */
  refreshCartFromServer(): void {
    const sessionId = this.getSessionId();
    const params = new HttpParams().set("sid", sessionId); // Bust CDN/proxy cache

    this.api
      .get<CartDto>(this.apiUrl, { ...this.options, params })
      .pipe(catchError(() => of(null)))
      .subscribe((dto) => {
        if (dto) {
          // On initial load or refresh: unconditionally replace local state
          // with server state. Server is the single source of truth.
          this.applyServerState(dto);
          this.initialLoadComplete = true;
        }
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
    suppressDrawer = false,
  ): Observable<CartDto> {
    // Block if another mutation is in progress
    if (this._isCartUpdating) {
      this.notificationService.info("Please wait...");
      return EMPTY;
    }

    const hasVariants = product.variants && product.variants.length > 0;
    const resolvedSize =
      size && size.trim() !== ""
        ? size
        : (hasVariants ? undefined : "One Size");

    if (hasVariants && !resolvedSize) {
      this.notificationService.error("Please select a size");
      throw new Error("Size is required for this product.");
    }

    const targetSize = resolvedSize ?? "One Size";

    // 1. Check for duplicates
    const currentItems = this.cartItemsSubject.getValue();
    const existingIndex = currentItems.findIndex(
      (i) => i.productId === product.id && i.size === targetSize
    );

    if (existingIndex !== -1) {
      this.notificationService.info(`${product.name} is already in your Bag`);
      return of(null) as any;
    }

    // 2. Optimistic UI update for NEW item
    const tempItem: CartItem = {
      id: `temp-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      size: targetSize,
      imageUrl: product.imageUrl || "",
      imageAlt: product.name,
      discountPercentage: product.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0,
      compareAtPrice: product.compareAtPrice,
    };

    const updatedItems = [...currentItems, tempItem];
    this.cartItemsSubject.next(updatedItems);
    this.notificationService.success(`${product.name} added to Bag`);

    // 3. Lock and perform server sync
    this._isCartUpdating = true;
    const payload: AddToCartDto = {
      productId: product.id,
      quantity,
      size: targetSize,
    };

    return this.api
      .post<CartDto>(`${this.apiUrl}/items`, payload, this.options)
      .pipe(
        tap((dto) => {
          // Replace entire local state with server response
          this.applyServerState(dto);
          if (!suppressDrawer) this.openDrawer();
        }),
        catchError((err) => {
          console.error("Failed to add item to cart", err);
          this.refreshCartFromServer(); // Re-sync to revert local state on failure
          throw err;
        }),
        finalize(() => {
          this._isCartUpdating = false;
        }),
      );
  }

  removeItem(cartItemId: string): void {
    // Block if another mutation is in progress
    if (this._isCartUpdating) return;

    // Backend uses numeric ID for cart items
    const numericId = parseInt(cartItemId, 10);
    if (isNaN(numericId)) return;

    // Prevent double-remove
    const currentRemoving = this.removingIdsSubject.getValue();
    if (currentRemoving.has(cartItemId)) return;

    // 1. Mark as sliding out (triggers animation + shows spinner)
    this.removingIdsSubject.next(new Set([...currentRemoving, cartItemId]));
    const currentSliding = this.slidingOutIdsSubject.getValue();
    this.slidingOutIdsSubject.next(new Set([...currentSliding, cartItemId]));

    // 2. After animation completes, remove from array and call API
    setTimeout(() => {
      // Remove from sliding state
      const sliding = this.slidingOutIdsSubject.getValue();
      const newSliding = new Set(sliding);
      newSliding.delete(cartItemId);
      this.slidingOutIdsSubject.next(newSliding);

      // Remove from array (optimistic)
      const items = this.cartItemsSubject.getValue();
      const removedItem = items.find((i) => i.id === cartItemId);
      this.cartItemsSubject.next(items.filter((i) => i.id !== cartItemId));

      // 3. Immediately call API to delete
      this._isCartUpdating = true;
      this.api
        .post<CartDto>(`${this.apiUrl}/items/${numericId}/delete`, {}, this.options)
        .pipe(
          finalize(() => {
            this._isCartUpdating = false;
            const removing = this.removingIdsSubject.getValue();
            const newRemoving = new Set(removing);
            newRemoving.delete(cartItemId);
            this.removingIdsSubject.next(newRemoving);
          }),
        )
        .subscribe({
          next: (dto) => {
            // Replace state with server-confirmed cart
            this.applyServerState(dto);
            if (removedItem) {
              this.notificationService.success(`${removedItem.name} removed from bag`);
            }
          },
          error: (err) => {
            console.error("Failed to remove item", err);
            this.refreshCartFromServer();
          },
        });
    }, this.SLIDE_OUT_MS);
  }

  isRemoving(cartItemId: string): boolean {
    return this.removingIdsSubject.getValue().has(cartItemId);
  }

  updateQty(cartItemId: string, quantity: number): void {
    // Block if another mutation is in progress
    if (this._isCartUpdating) return;

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

      // 2. Schedule server sync (debounced)
      this.qtyUpdateSubject.next({ id: cartItemId, qty: sanitizedQty });
    }
  }

  clearCart(): Observable<CartDto> {
    // Block if another mutation is in progress
    if (this._isCartUpdating) {
      return EMPTY;
    }

    // 1. Optimistic UI update
    const previousItems = this.cartItemsSubject.getValue();
    this.cartItemsSubject.next([]);

    // 2. Lock and perform backend deletion
    this._isCartUpdating = true;
    return this.api.post<CartDto>(`${this.apiUrl}/clear`, {}, this.options).pipe(
      tap((dto) => {
        // Replace state with server-confirmed empty cart
        this.applyServerState(dto);
      }),
      catchError((err) => {
        console.error("Failed to clear cart on server", err);
        this.cartItemsSubject.next(previousItems); // Rollback on failure
        throw err;
      }),
      finalize(() => {
        this._isCartUpdating = false;
      }),
    );
  }

  mergeGuestCart(): Observable<CartDto | null> {
    const sessionId = localStorage.getItem(StorageKeys.CART_SESSION_ID);
    if (!sessionId) return of(null);

    this._isCartUpdating = true;

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
            // Replace state with server-confirmed merged cart
            this.applyServerState(dto);
          }
        }),
        catchError((err) => {
          console.error("Failed to merge guest cart", err);
          return of(null);
        }),
        finalize(() => {
          this._isCartUpdating = false;
        }),
      );
  }

  /**
   * Applies the server response as the single source of truth.
   * Completely replaces local state — no merging, no preserving temp items
   * unless they are genuinely pending (addItem in flight).
   */
  private applyServerState(dto: CartDto): void {
    const serverItems = this.mapDtoToItems(dto);
    const localItems = this.cartItemsSubject.getValue();

    // Server items are the authoritative source of truth.
    const result = [...serverItems];

    // Only preserve temp items if an addItem request is currently in flight
    // (indicated by _isCartUpdating being true AND temp items existing).
    // Once the addItem completes, applyServerState is called again with the
    // server response that includes the newly added item — so temps are dropped.
    if (this._isCartUpdating) {
      const tempItems = localItems.filter(
        (localItem) =>
          localItem.id.startsWith("temp-") &&
          !serverItems.some(
            (serverItem) =>
              serverItem.productId === localItem.productId &&
              (serverItem.size || "").trim().toLowerCase() === (localItem.size || "").trim().toLowerCase()
          )
      );
      result.push(...tempItems);
    }

    this.cartItemsSubject.next(result);
  }

  private mapDtoToItems(dto: CartDto): CartItem[] {
    return dto.items.map((i) => ({
      id: i.id.toString(),
      productId: i.productId,
      name: i.productName,
      price: i.price,
      quantity: i.quantity,
      size: i.size,
      imageUrl: i.imageUrl,
      imageAlt: i.productName,
      discountPercentage: i.salePrice
        ? Math.round(((i.salePrice - i.price) / i.salePrice) * 100)
        : 0,
      compareAtPrice: i.salePrice,
    }));
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
}

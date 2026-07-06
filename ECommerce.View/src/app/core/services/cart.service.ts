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
  Subscription,
  finalize,
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

export interface RemovedCartItem {
  item: CartItem;
  index: number;
}

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

  private readonly cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly cartItems$ = this.cartItemsSubject.asObservable();

  readonly summary$ = this.cartItems$.pipe(
    map((items) => this.calculateSummary(items)),
  );

  private lastMutation = 0;

  private readonly qtyUpdateSubject = new BehaviorSubject<{
    id: string;
    qty: number;
  } | null>(null);

  private readonly isDrawerOpenSubject = new BehaviorSubject<boolean>(false);
  readonly isDrawerOpen$ = this.isDrawerOpenSubject.asObservable();

  // Undo support: emits when an item is removed (for undo toast)
  private readonly removedItemSubject = new BehaviorSubject<RemovedCartItem | null>(null);
  readonly removedItem$ = this.removedItemSubject.asObservable();

  // Loading state: tracks which item IDs are currently being removed
  private readonly removingIdsSubject = new BehaviorSubject<Set<string>>(new Set());
  readonly removingIds$ = this.removingIdsSubject.asObservable();

  // Sliding out state: tracks items mid-animation (before DOM removal)
  private readonly slidingOutIdsSubject = new BehaviorSubject<Set<string>>(new Set());
  readonly slidingOutIds$ = this.slidingOutIdsSubject.asObservable();

  // Pending undo timers: itemId -> timeout ID
  private readonly undoTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // Pending delete subscriptions: itemId -> subscription (to cancel if undone)
  private readonly pendingDeletes = new Map<string, Subscription>();

  // Animation duration (ms) for slide-out
  private readonly SLIDE_OUT_MS = 300;

  // Undo window duration (ms) before actual API delete fires
  private readonly UNDO_WINDOW_MS = 8000;

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
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((dto) => {
        if (dto) this.reconcileState(dto);
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

  refreshCartFromServer(): void {
    const sessionId = this.getSessionId();
    const params = new HttpParams().set("sid", sessionId); // Add sid to URL to bypass potential CDN/Proxy shared caching
    const requestTime = Date.now();

    this.api
      .get<CartDto>(this.apiUrl, { ...this.options, params })
      .pipe(catchError(() => of(null)))
      .subscribe((dto) => {
        if (dto && requestTime > this.lastMutation) {
          this.updateLocalState(dto);
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

    // 3. Perform background sync
    const payload: AddToCartDto = {
      productId: product.id,
      quantity,
      size: targetSize,
    };

    this.lastMutation = Date.now();

    return this.api
      .post<CartDto>(`${this.apiUrl}/items`, payload, this.options)
      .pipe(
        tap((dto) => {
          this.reconcileState(dto);
          if (!suppressDrawer) this.openDrawer();
        }),
        catchError((err) => {
          console.error("Failed to add item to cart", err);
          this.refreshCartFromServer(); // Re-sync to revert local state on failure
          throw err;
        }),
      );
  }

  removeItem(cartItemId: string): void {
    // Backend uses numeric ID for cart items
    const numericId = parseInt(cartItemId, 10);
    if (isNaN(numericId)) return;

    // Prevent double-remove
    const currentRemoving = this.removingIdsSubject.getValue();
    if (currentRemoving.has(cartItemId)) return;

    // 1. Find item and its index before removal (for undo)
    const currentItems = this.cartItemsSubject.getValue();
    const itemIndex = currentItems.findIndex((i) => i.id === cartItemId);
    if (itemIndex === -1) return;
    const removedItem = { ...currentItems[itemIndex] };

    // 2. Phase 1: Mark as sliding out (triggers animation + shows spinner)
    this.removingIdsSubject.next(new Set([...currentRemoving, cartItemId]));
    const currentSliding = this.slidingOutIdsSubject.getValue();
    this.slidingOutIdsSubject.next(new Set([...currentSliding, cartItemId]));

    // 3. Phase 2: After animation completes, remove from array
    setTimeout(() => {
      // Remove from sliding state
      const sliding = this.slidingOutIdsSubject.getValue();
      const newSliding = new Set(sliding);
      newSliding.delete(cartItemId);
      this.slidingOutIdsSubject.next(newSliding);

      // Remove from array
      const items = this.cartItemsSubject.getValue();
      this.cartItemsSubject.next(items.filter((i) => i.id !== cartItemId));

      // 4. Show undo toast
      this.notificationService.showUndo(
        `${removedItem.name} removed from bag`,
        () => this.restoreItem({ item: removedItem, index: itemIndex }),
        this.UNDO_WINDOW_MS,
      );

      // 5. Schedule delayed delete (gives user time to undo)
      const timer = setTimeout(() => {
        this.undoTimers.delete(cartItemId);
        this.performDelete(cartItemId, numericId);
      }, this.UNDO_WINDOW_MS);
      this.undoTimers.set(cartItemId, timer);
    }, this.SLIDE_OUT_MS);
  }

  restoreItem(removedCartItem: RemovedCartItem): void {
    const { item, index } = removedCartItem;
    const currentItems = this.cartItemsSubject.getValue();

    // Cancel pending delete
    const timer = this.undoTimers.get(item.id);
    if (timer) {
      clearTimeout(timer);
      this.undoTimers.delete(item.id);
    }

    const sub = this.pendingDeletes.get(item.id);
    if (sub) {
      sub.unsubscribe();
      this.pendingDeletes.delete(item.id);
    }

    // Remove from removing state
    const currentRemoving = this.removingIdsSubject.getValue();
    const newRemoving = new Set(currentRemoving);
    newRemoving.delete(item.id);
    this.removingIdsSubject.next(newRemoving);

    // Remove from sliding state
    const currentSliding = this.slidingOutIdsSubject.getValue();
    const newSliding = new Set(currentSliding);
    newSliding.delete(item.id);
    this.slidingOutIdsSubject.next(newSliding);

    // Restore item at its original index (or end if index is out of bounds)
    const restoredItems = [...currentItems];
    const insertAt = Math.min(index, restoredItems.length);
    restoredItems.splice(insertAt, 0, item);
    this.cartItemsSubject.next(restoredItems);
  }

  isRemoving(cartItemId: string): boolean {
    return this.removingIdsSubject.getValue().has(cartItemId);
  }

  private performDelete(cartItemId: string, numericId: number): void {
    this.lastMutation = Date.now();
    const sub = this.api
      .post<CartDto>(`${this.apiUrl}/items/${numericId}/delete`, {}, this.options)
      .pipe(
        finalize(() => {
          const currentRemoving = this.removingIdsSubject.getValue();
          const newRemoving = new Set(currentRemoving);
          newRemoving.delete(cartItemId);
          this.removingIdsSubject.next(newRemoving);
        }),
      )
      .subscribe({
        next: (dto) => {
          this.pendingDeletes.delete(cartItemId);
          this.reconcileState(dto);
        },
        error: (err) => {
          this.pendingDeletes.delete(cartItemId);
          console.error("Failed to remove item", err);
          this.refreshCartFromServer();
        },
      });
    this.pendingDeletes.set(cartItemId, sub);
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
      this.lastMutation = Date.now();
      this.qtyUpdateSubject.next({ id: cartItemId, qty: sanitizedQty });
    }
  }

  clearCart(): Observable<any> {
    // 1. Optimistic UI update
    const previousItems = this.cartItemsSubject.getValue();
    this.cartItemsSubject.next([]);

    // 2. Perform backend deletion
    this.lastMutation = Date.now();
    return this.api.post(`${this.apiUrl}/clear`, {}, this.options).pipe(
      catchError((err) => {
        console.error("Failed to clear cart on server", err);
        this.cartItemsSubject.next(previousItems); // Rollback on failure
        throw err;
      }),
    );
  }

  mergeGuestCart(): Observable<CartDto | null> {
    const sessionId = localStorage.getItem(StorageKeys.CART_SESSION_ID);
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
            this.reconcileState(dto);
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
    const mappedItems = this.mapDtoToItems(dto);
    this.cartItemsSubject.next(mappedItems);
  }

  private reconcileState(dto: CartDto): void {
    const serverItems = this.mapDtoToItems(dto);
    const localItems = this.cartItemsSubject.getValue();

    // Server items are source of truth for confirmed items
    const reconciled = [...serverItems];

    // Preserve any local items with temp- IDs (optimistic adds not yet on server)
    const tempItems = localItems.filter((i) => i.id.startsWith("temp-"));
    reconciled.push(...tempItems);

    this.cartItemsSubject.next(reconciled);
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

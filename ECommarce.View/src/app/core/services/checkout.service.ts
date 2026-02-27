import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, map, of, tap } from "rxjs";

import { CheckoutState } from "../models/checkout";
import { CartService } from "./cart.service";
import { OrderService } from "./order.service";
import { CustomerProfileService } from "./customer-profile.service";

@Injectable({
  providedIn: "root",
})
export class CheckoutService {
  private readonly storageBaseKey = "checkout_state";
  private activeStorageKey = this.storageBaseKey;

  private readonly stateSubject = new BehaviorSubject<CheckoutState>(
    this.buildDefaultState(),
  );

  readonly state$ = this.stateSubject.asObservable();

  constructor(
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly profileService: CustomerProfileService,
  ) {
    const storedState = this.loadState();
    this.stateSubject.next(storedState ?? this.buildDefaultState());

    this.state$.subscribe((state) => {
      localStorage.setItem(this.activeStorageKey, JSON.stringify(state));
    });
  }

  updateState(partial: Partial<CheckoutState>): void {
    this.stateSubject.next({ ...this.stateSubject.getValue(), ...partial });
  }

  createOrder(): Observable<number | null> {
    const state = this.stateSubject.getValue();
    const cartItems = this.cartService.getCartSnapshot();
    const summary = this.cartService.getSummarySnapshot();
    if (!cartItems.length) {
      return of(null);
    }

    return this.orderService
      .placeOrder({
        state,
        cartItems,
        summary,
        deliveryMethodId: state.deliveryMethodId,
      })
      .pipe(
        tap(() => {
          this.profileService.storePhone(state.phone);
          this.cartService.clearCart();
          this.resetState();
        }),
        map((order) => order.id),
      );
  }

  resetState(): void {
    this.stateSubject.next(this.buildDefaultState());
  }

  getStateSnapshot(): CheckoutState {
    return this.stateSubject.getValue();
  }

  private buildDefaultState(): CheckoutState {
    return {
      fullName: "",
      phone: "",
      address: "",
      deliveryMethodId: undefined,
    };
  }

  private loadState(): CheckoutState | null {
    const stored = localStorage.getItem(this.activeStorageKey);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as CheckoutState;
    } catch {
      return null;
    }
  }
}

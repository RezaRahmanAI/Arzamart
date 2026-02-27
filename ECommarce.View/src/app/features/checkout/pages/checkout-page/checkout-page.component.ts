import { Component, DestroyRef, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
  tap,
  startWith,
  shareReplay,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { CartService } from "../../../../core/services/cart.service";
import { CheckoutService } from "../../../../core/services/checkout.service";
import { CartItem } from "../../../../core/models/cart";
import { CustomerOrderApiService } from "../../../../core/services/customer-order-api.service";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { AuthService } from "../../../../core/services/auth.service";
import { SettingsService } from "../../../../admin/services/settings.service";
import { AnalyticsService } from "../../../../core/services/analytics.service";
import {
  DeliveryMethod,
  AdminSettings,
} from "../../../../admin/models/settings.models";

import {
  LucideAngularModule,
  CheckCircle2,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Truck,
  Info,
} from "lucide-angular";

@Component({
  selector: "app-checkout-page",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./checkout-page.component.html",
  styleUrl: "./checkout-page.component.css",
})
export class CheckoutPageComponent {
  readonly icons = {
    CheckCircle2,
    ArrowLeft,
    User,
    Phone,
    MapPin,
    Truck,
    Info,
  };
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly customerOrderApi = inject(CustomerOrderApiService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    deliveryMethodId: [0, Validators.required],
  });

  isLoading = false;
  errorMessage = "";
  didAutofill = false;

  private readonly settingsService = inject(SettingsService);

  readonly deliveryMethods$ = this.settingsService
    .getPublicDeliveryMethods()
    .pipe(
      tap((methods) => {
        if (methods.length > 0) {
          const defaultMethod =
            methods.find((m) => m.name.toLowerCase().includes("inside")) ||
            methods[0];
          const currentId = this.checkoutForm.controls.deliveryMethodId.value;
          if (!currentId) {
            this.checkoutForm.patchValue({
              deliveryMethodId: defaultMethod.id,
            });
          }
        }
      }),
      shareReplay(1),
    );

  readonly summary$ = this.cartService.summary$;

  readonly vm$ = combineLatest([
    this.cartService.getCart(),
    this.summary$,
    this.settingsService
      .getSettings()
      .pipe(startWith(null as AdminSettings | null)),
    this.deliveryMethods$.pipe(startWith([] as DeliveryMethod[])),
  ]).pipe(
    map(([cartItems, summary, settings, deliveryMethods]) => {
      const freeShippingThreshold = settings?.freeShippingThreshold ?? 0;
      const isFreeShipping =
        freeShippingThreshold > 0 && summary.subtotal >= freeShippingThreshold;

      // Update delivery methods costs if free shipping applies
      const effectiveDeliveryMethods = deliveryMethods.map((m) => ({
        ...m,
        cost: isFreeShipping ? 0 : m.cost,
      }));

      // Find the currently selected method in the effective list (to get the updated cost)
      const currentMethodId = this.checkoutForm.controls.deliveryMethodId.value;
      const selectedMethod =
        effectiveDeliveryMethods.find((m) => m.id === currentMethodId) || null;

      const shipping = selectedMethod ? selectedMethod.cost : summary.shipping;
      const total = summary.subtotal + summary.tax + shipping;

      return {
        cartItems,
        summary: { ...summary, shipping, total },
        deliveryMethods: effectiveDeliveryMethods,
        isFreeShipping,
      };
    }),
    tap(({ cartItems, summary }) => {
      this.analyticsService.trackInitiateCheckout(cartItems, summary.total);
    }),
    shareReplay(1),
  );

  constructor() {
    this.checkoutService.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.checkoutForm.patchValue({
          fullName: state.fullName,
          phone: state.phone,
          address: state.address,
        });
      });

    this.checkoutForm.controls.phone.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        tap((value) => {
          if (value.length < 7) {
            this.didAutofill = false;
          }
        }),
        filter((value) => value.length >= 7),
        switchMap((phone) =>
          this.customerOrderApi
            .lookupCustomer(phone)
            .pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((customer) => {
        if (customer) {
          this.didAutofill = true;
          this.checkoutForm.patchValue(
            {
              fullName: customer.name,
              address: customer.address,
            },
            { emitEvent: false },
          );
          return;
        }

        this.didAutofill = false;
      });
  }

  placeOrder(): void {
    if (this.checkoutForm.invalid || this.isLoading) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.persistCheckoutState();
    this.checkoutService
      .createOrder()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orderId) => {
          this.isLoading = false;
          if (!orderId) {
            return;
          }

          if (!this.authService.isLoggedIn()) {
            const phone = this.checkoutForm.controls.phone.value;
            this.authService.customerPhoneLogin(phone).subscribe({
              next: () =>
                void this.router.navigate(["/order-confirmation", orderId]),
              error: () =>
                void this.router.navigate(["/order-confirmation", orderId]),
            });
          } else {
            void this.router.navigate(["/order-confirmation", orderId]);
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = error.message ?? "Unable to place order.";
        },
      });
  }

  trackCartItem(_: number, item: CartItem): string {
    return item.id;
  }

  private persistCheckoutState(): void {
    this.checkoutService.updateState({
      fullName: this.checkoutForm.controls.fullName.value ?? "",
      phone: this.checkoutForm.controls.phone.value ?? "",
      address: this.checkoutForm.controls.address.value ?? "",
      deliveryMethodId:
        this.checkoutForm.controls.deliveryMethodId.value ?? undefined,
    });
  }
}

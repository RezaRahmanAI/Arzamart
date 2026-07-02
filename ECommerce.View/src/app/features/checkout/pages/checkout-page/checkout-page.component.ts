import { Component, ChangeDetectionStrategy, DestroyRef, inject } from "@angular/core";
import { AsyncPipe, NgClass, DecimalPipe, NgIf } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  tap,
  startWith,
  shareReplay,
  take,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { CartService } from "../../../../core/services/cart.service";
import { CheckoutService } from "../../../../core/services/checkout.service";
import { CartItem } from "../../../../core/models/cart";
import { CustomerLookupService } from "../../../../core/services/customer-lookup.service";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { AuthService } from "../../../../core/services/auth.service";
import { DeliveryService } from "../../../../core/services/delivery.service";
import { SiteSettingsService, SiteSettings } from "../../../../core/services/site-settings.service";
import { AnalyticsService } from "../../../../core/services/analytics.service";
import { IncompleteOrderTrackerService } from "../../../../core/services/incomplete-order-tracker.service";
import {
  DeliveryMethod,
} from "../../../../core/models/delivery";
import { BANGLADESH_LOCATIONS } from "../../../../core/utils/bangladesh-locations";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";
import { UserPersistenceService } from "../../../../core/services/user-persistence.service";
import { NotificationService } from "../../../../core/services/notification.service";
import { matchLocationFromAddress } from "../../../../core/utils/location-matcher";


@Component({
  selector: "app-checkout-page",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
    AppIconComponent,
    NgClass,
    NgIf
  ],
  templateUrl: "./checkout-page.component.html",
  styleUrl: "./checkout-page.component.css",
})
export class CheckoutPageComponent {
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly customerLookup = inject(CustomerLookupService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly deliveryService = inject(DeliveryService);
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly userPersistence = inject(UserPersistenceService);
  private readonly notification = inject(NotificationService);
  private readonly trackerService = inject(IncompleteOrderTrackerService);

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    city: [""],
    area: [""],
    deliveryMethodId: [0, Validators.min(0)],
    paymentMethod: ["cod", Validators.required],
  });

  cities = Object.keys(BANGLADESH_LOCATIONS).sort();
  filteredCities: string[] = [];
  citySearch = "";
  isCityDropdownOpen = false;

  areas: string[] = [];
  filteredAreas: string[] = [];
  areaSearch = "";
  isAreaDropdownOpen = false;

  isLoading = false;
  errorMessage = "";
  didAutofill = false;
  showAutofillPrompt = false;

  readonly deliveryMethods$ = this.deliveryService
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
      catchError((err) => {
        console.error("Failed to load delivery methods", err);
        return of([] as DeliveryMethod[]);
      }),
    );

  readonly summary$ = this.cartService.summary$;

  readonly vm$ = combineLatest([
    this.cartService.getCart(),
    this.summary$,
    this.siteSettingsService
      .getSettings()
      .pipe(startWith(null as SiteSettings | null)),
    this.deliveryMethods$.pipe(startWith([] as DeliveryMethod[])),
    this.checkoutForm.controls.deliveryMethodId.valueChanges.pipe(
      startWith(this.checkoutForm.controls.deliveryMethodId.value),
    ),
  ]).pipe(
    map(([cartItems, summary, settings, deliveryMethods, currentMethodId]) => {
      const rawMethods = (deliveryMethods && deliveryMethods.length > 0) 
        ? deliveryMethods 
        : [];
      
      const activeMethods = rawMethods.filter(m => m.isActive);
      const freeShippingThreshold = settings?.freeShippingThreshold ?? 0;
      const isFreeShipping =
        freeShippingThreshold > 0 && summary.subtotal >= freeShippingThreshold;

      const effectiveDeliveryMethods = activeMethods.map((m) => ({
        ...m,
        cost: isFreeShipping ? 0 : m.cost,
      }));

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
          city: state.city,
          area: state.area
        });
        if (state.city) {
          this.areas = BANGLADESH_LOCATIONS[state.city] || [];
          this.filteredAreas = [...this.areas];
          this.citySearch = state.city;
          this.updateDeliveryMethod(state.city, state.area || "");
        }
        if (state.area) {
          this.areaSearch = state.area;
        }
      });

    // Incomplete order tracking setup
    this.trackerService.trackForm(
      this.checkoutForm,
      () => {
        const cartItems = this.cartService.getCartSnapshot();
        const summary = this.cartService.getSummarySnapshot();
        const firstItem = cartItems && cartItems.length > 0 ? cartItems[0] : null;
        
        return {
          productId: firstItem?.productId || null,
          productName: firstItem?.name || null,
          quantity: firstItem?.quantity || 1,
          totalPrice: summary.subtotal,
          selectedSize: firstItem?.size || undefined
        };
      },
      () => ({
        landingPageName: "Standard Checkout Page"
      })
    );

    if (this.userPersistence.hasSavedDetails()) {
      this.showAutofillPrompt = true;
    }

    this.checkoutForm.controls.city.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((city) => {
        this.areas = BANGLADESH_LOCATIONS[city] || [];
        this.filteredAreas = [...this.areas];
        this.checkoutForm.patchValue({ area: "" });
        this.areaSearch = "";
        this.citySearch = city;
        this.updateDeliveryMethod(city, "");
      });

    this.checkoutForm.controls.area.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((area) => {
        const city = this.checkoutForm.controls.city.value;
        this.updateDeliveryMethod(city, area);
      });

    this.customerLookup
      .bindTo(this.checkoutForm.controls.phone.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((customer) => {
        if (customer) {
          this.didAutofill = true;
          if (customer.city) {
            this.areas = BANGLADESH_LOCATIONS[customer.city] || [];
            this.filteredAreas = [...this.areas];
            this.citySearch = customer.city;
            this.updateDeliveryMethod(customer.city, customer.area || "");
          }
          this.checkoutForm.patchValue(
            {
              fullName: customer.name,
              address: customer.address,
              city: customer.city || "Dhaka",
              area: customer.area || ""
            },
            { emitEvent: false },
          );
          if (customer.area) {
            this.areaSearch = customer.area;
          }
          return;
        }
        this.didAutofill = false;
      });

    this.checkoutForm.controls.address.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((address) => {
        if (!address || address.length < 3) return;
        this.intelligentLocationMatch(address);
      });
  }

  intelligentLocationMatch(address: string): void {
    const { city, area } = matchLocationFromAddress(address, this.cities);
    
    if (city) {
      if (this.checkoutForm.get("city")?.value !== city) {
        this.selectCity(city);
      }
      
      if (area && this.checkoutForm.get("area")?.value !== area) {
        this.selectArea(area);
      }
    }
  }


  applyAutofill(): void {
    const details = this.userPersistence.getUserDetails();
    if (details) {
      if (details.city) {
        this.areas = BANGLADESH_LOCATIONS[details.city] || [];
        this.filteredAreas = [...this.areas];
        this.citySearch = details.city;
        this.updateDeliveryMethod(details.city, details.area || "");
      }
      this.checkoutForm.patchValue({
        fullName: details.fullName,
        phone: details.phone,
        address: details.address,
        city: details.city,
        area: details.area
      });
      if (details.area) {
        this.areaSearch = details.area;
      }
      this.showAutofillPrompt = false;
      this.notification.success("Information filled successfully!");
    }
  }

  dismissAutofill(): void {
    this.showAutofillPrompt = false;
  }

  placeOrder(): void {
    if (this.checkoutForm.invalid || this.isLoading) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.persistCheckoutState();
    
    const phone = this.checkoutForm.controls.phone.value;

    this.checkoutService
      .createOrder()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orderId) => {
          this.isLoading = false;
          if (!orderId) return;

          if (!this.authService.isLoggedIn()) {
            this.authService.customerPhoneLogin(phone).subscribe({
              next: () => void this.router.navigate(["/order-confirmation", orderId]),
              error: () => void this.router.navigate(["/order-confirmation", orderId]),
            });
          } else {
            void this.router.navigate(["/order-confirmation", orderId]);
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message ?? error.message ?? "Unable to place order.";
        },
      });
  }

  private updateDeliveryMethod(city: string, area: string): void {
    const outskirts = ["keraniganj", "savar", "ashulia", "asulia", "dohar"];
    const outskirtsSet = new Set(outskirts);
    const isOutskirts = area && outskirtsSet.has(area.toLowerCase());
    const isDhaka = city.toLowerCase() === "dhaka" && !isOutskirts;
    this.deliveryMethods$.pipe(take(1)).subscribe((methods) => {
      const method = methods.find((m) =>
        isDhaka
          ? m.name.toLowerCase().includes("inside")
          : m.name.toLowerCase().includes("outside"),
      );
      if (method) {
        this.checkoutForm.patchValue({ deliveryMethodId: method.id });
      }
    });
  }

  filterCities(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.citySearch = query;
    this.filteredCities = this.cities.filter(c => c.toLowerCase().includes(query));
  }

  selectCity(city: string): void {
    this.checkoutForm.patchValue({ city });
    this.citySearch = city;
    this.isCityDropdownOpen = false;
  }

  toggleCityDropdown(): void {
    this.isCityDropdownOpen = !this.isCityDropdownOpen;
    if (this.isCityDropdownOpen) {
      this.isAreaDropdownOpen = false;
      this.filteredCities = [...this.cities];
      this.citySearch = this.checkoutForm.get('city')?.value || "";
    }
  }

  filterAreas(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.areaSearch = query;
    this.filteredAreas = this.areas.filter(a => a.toLowerCase().includes(query));
  }

  selectArea(area: string): void {
    this.checkoutForm.patchValue({ area });
    this.areaSearch = area;
    this.isAreaDropdownOpen = false;
  }

  toggleAreaDropdown(): void {
    if (!this.checkoutForm.get('city')?.value) return;
    this.isAreaDropdownOpen = !this.isAreaDropdownOpen;
    if (this.isAreaDropdownOpen) {
      this.isCityDropdownOpen = false;
      this.filteredAreas = [...this.areas];
      this.areaSearch = this.checkoutForm.get('area')?.value || "";
    }
  }

  getSelectedMethod(methods: DeliveryMethod[]): DeliveryMethod | undefined {
    const id = this.checkoutForm.get('deliveryMethodId')?.value;
    return methods.find(m => m.id === id);
  }

  trackCartItem(_: number, item: CartItem): string {
    return item.id;
  }

  private persistCheckoutState(): void {
    this.checkoutService.updateState({
      fullName: this.checkoutForm.controls.fullName.value ?? "",
      phone: this.checkoutForm.controls.phone.value ?? "",
      address: this.checkoutForm.controls.address.value ?? "",
      city: this.checkoutForm.controls.city.value ?? "",
      area: this.checkoutForm.controls.area.value ?? "",
      deliveryMethodId: this.checkoutForm.controls.deliveryMethodId.value ?? undefined,
    });
  }
}

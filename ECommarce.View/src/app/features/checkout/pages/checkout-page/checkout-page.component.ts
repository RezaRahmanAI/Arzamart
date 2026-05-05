import { Component, DestroyRef, inject } from "@angular/core";
import { AsyncPipe, NgClass, DecimalPipe, NgIf } from "@angular/common";
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
import { BANGLADESH_LOCATIONS } from "../../../../core/utils/bangladesh-locations";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";
import { UserPersistenceService } from "../../../../core/services/user-persistence.service";
import { NotificationService } from "../../../../core/services/notification.service";
import { matchLocationFromAddress } from "../../../../core/utils/location-matcher";


@Component({
  selector: "app-checkout-page",
  standalone: true,
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
  private readonly customerOrderApi = inject(CustomerOrderApiService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly settingsService = inject(SettingsService);
  private readonly userPersistence = inject(UserPersistenceService);
  private readonly notification = inject(NotificationService);

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    city: [""],
    area: [""],
    deliveryMethodId: [0, Validators.required],
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
      catchError((err) => {
        console.error("Failed to load delivery methods", err);
        return of([] as DeliveryMethod[]);
      }),
    );

  readonly summary$ = this.cartService.summary$;

  readonly vm$ = combineLatest([
    this.cartService.getCart(),
    this.summary$,
    this.settingsService
      .getSettings()
      .pipe(startWith(null as AdminSettings | null)),
    this.deliveryMethods$.pipe(startWith([] as DeliveryMethod[])),
    this.checkoutForm.controls.deliveryMethodId.valueChanges.pipe(
      startWith(this.checkoutForm.controls.deliveryMethodId.value),
    ),
  ]).pipe(
    map(([cartItems, summary, settings, deliveryMethods, currentMethodId]) => {
      const rawMethods = (deliveryMethods && deliveryMethods.length > 0) 
        ? deliveryMethods 
        : (settings?.deliveryMethods || []);
      
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
          this.updateDeliveryMethodByCity(state.city);
        }
        if (state.area) {
          this.areaSearch = state.area;
        }
      });

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
        this.updateDeliveryMethodByCity(city);
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
          if (customer.city) {
            this.areas = BANGLADESH_LOCATIONS[customer.city] || [];
            this.filteredAreas = [...this.areas];
            this.citySearch = customer.city;
            this.updateDeliveryMethodByCity(customer.city);
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
        this.updateDeliveryMethodByCity(details.city);
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
    this.checkoutService
      .createOrder()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orderId) => {
          this.isLoading = false;
          if (!orderId) return;

          if (!this.authService.isLoggedIn()) {
            const phone = this.checkoutForm.controls.phone.value;
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

  private updateDeliveryMethodByCity(city: string): void {
    const isDhaka = city.toLowerCase() === "dhaka";
    this.deliveryMethods$.subscribe((methods) => {
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

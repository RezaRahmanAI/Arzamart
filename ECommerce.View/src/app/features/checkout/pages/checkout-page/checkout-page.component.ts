import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal } from "@angular/core";
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
import { DeliveryMethod } from "../../../../core/models/delivery";
import { LocationService } from "../../../../core/services/location.service";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";
import { UserPersistenceService } from "../../../../core/services/user-persistence.service";
import { NotificationService } from "../../../../core/services/notification.service";
import {
  DivisionDto,
  DistrictDto,
  UpazilaDto,
} from "../../../../core/models/location";

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
    NgIf,
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
  private readonly locationService = inject(LocationService);

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    city: [""],
    area: [""],
    deliveryMethodId: [0, Validators.min(0)],
    paymentMethod: ["cod", Validators.required],
  });

  divisions = signal<DivisionDto[]>([]);
  districts = signal<DistrictDto[]>([]);
  upazilas = signal<UpazilaDto[]>([]);

  filteredDistricts: DistrictDto[] = [];
  filteredUpazilas: UpazilaDto[] = [];
  districtSearch = "";
  upazilaSearch = "";
  isDistrictDropdownOpen = false;
  isUpazilaDropdownOpen = false;

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
      const rawMethods = deliveryMethods && deliveryMethods.length > 0
        ? deliveryMethods
        : [];

      const activeMethods = rawMethods.filter((m) => m.isActive);
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
    this.locationService
      .getDivisions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (divisions) => {
          this.divisions.set(divisions);
        },
        error: (err) => {
          console.error("Failed to load divisions", err);
        },
      });

    this.checkoutService.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.checkoutForm.patchValue({
          fullName: state.fullName,
          phone: state.phone,
          address: state.address,
          city: state.city,
          area: state.area,
        });
        if (state.city) {
          this.loadDistrictsByCity(state.city);
          if (state.area) {
            this.upazilaSearch = state.area;
          }
          this.districtSearch = state.city;
          this.updateDeliveryMethod(state.city, state.area || "");
        }
        if (state.area) {
          this.upazilaSearch = state.area;
        }
      });

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
          selectedSize: firstItem?.size || undefined,
        };
      },
      () => ({
        landingPageName: "Standard Checkout Page",
      }),
    );

    if (this.userPersistence.hasSavedDetails()) {
      this.showAutofillPrompt = true;
    }

    this.checkoutForm.controls.city.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((city) => {
        this.loadDistrictsByCity(city);
        this.checkoutForm.patchValue({ area: "" });
        this.upazilaSearch = "";
        this.districtSearch = city;
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

          if (customer.divisionId) {
            const div = this.divisions().find((d) => d.id === customer.divisionId);
            if (div) {
              this.checkoutForm.patchValue({ city: div.nameEn }, { emitEvent: false });
              this.districtSearch = div.nameEn;
              this.locationService.getDistrictsByDivision(div.id).subscribe((districts) => {
                this.districts.set(districts);
                this.filteredDistricts = [...districts];

                if (customer.districtId) {
                  const dist = districts.find((d) => d.id === customer.districtId);
                  if (dist) {
                    this.checkoutForm.patchValue({ city: dist.nameEn }, { emitEvent: false });
                    this.districtSearch = dist.nameEn;
                    this.loadUpazilasByDistrict(dist.nameEn, customer.area || "");

                    if (customer.upazilaId) {
                      this.locationService.getUpazilasByDistrict(dist.id).subscribe((upazilas) => {
                        const upazila = upazilas.find((u) => u.id === customer.upazilaId);
                        if (upazila) {
                          this.checkoutForm.patchValue({ area: upazila.nameEn }, { emitEvent: false });
                          this.upazilaSearch = upazila.nameEn;
                          this.selectedUpazilaId.set(upazila.id);
                        }
                      });
                    }
                  }
                }
                this.updateDeliveryMethod(this.checkoutForm.controls.city.value, customer.area || "");
              });
            }
          } else if (customer.city) {
            this.loadDistrictsByCity(customer.city);
            this.districtSearch = customer.city;
            if (customer.area) {
              this.upazilaSearch = customer.area;
              this.loadUpazilasByDistrict(customer.city, customer.area);
            }
            this.updateDeliveryMethod(customer.city, customer.area || "");
          }

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

    this.checkoutForm.controls.address.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((address) => {
        if (!address || address.length < 3) return;
        this.intelligentLocationMatch(address);
      });
  }

  private loadDistrictsByCity(city: string): void {
    if (!city) {
      this.districts.set([]);
      this.filteredDistricts = [];
      return;
    }
    const div = this.divisions().find(
      (d) => d.nameEn.toLowerCase() === city.toLowerCase(),
    );
    if (div) {
      this.locationService.getDistrictsByDivision(div.id).subscribe((districts) => {
        this.districts.set(districts);
        this.filteredDistricts = [...districts];
      });
    } else {
      this.districts.set([]);
      this.filteredDistricts = [];
    }
  }

  private loadUpazilasByDistrict(districtName: string, _city: string): void {
    const dist = this.districts().find(
      (d) => d.nameEn.toLowerCase() === districtName.toLowerCase(),
    );
    if (dist) {
      this.locationService.getUpazilasByDistrict(dist.id).subscribe((upazilas) => {
        this.upazilas.set(upazilas);
        this.filteredUpazilas = [...upazilas];
      });
    }
  }

  intelligentLocationMatch(address: string): void {
    const allDivisions = this.divisions();
    for (const div of allDivisions) {
      if (address.toLowerCase().includes(div.nameEn.toLowerCase())) {
        if (this.checkoutForm.get("city")?.value !== div.nameEn) {
          this.selectCity(div.nameEn);
        }
        break;
      }
    }
  }

  applyAutofill(): void {
    const details = this.userPersistence.getUserDetails();
    if (details) {
      const city = details.city || "Dhaka";
      this.loadDistrictsByCity(city);
      this.districtSearch = city;
      if (details.area) {
        this.upazilaSearch = details.area;
      }
      this.updateDeliveryMethod(city, details.area || "");
      this.checkoutForm.patchValue({
        fullName: details.fullName,
        phone: details.phone,
        address: details.address,
        city,
        area: details.area,
      });
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

  private updateDeliveryMethod(city: string, _area: string): void {
    this.deliveryMethods$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((methods) => {
      const district = this.districts().find(
        (d) => d.nameEn.toLowerCase() === city.toLowerCase(),
      );
      const isInsideDhaka = district
        ? district.nameEn.toLowerCase() === "dhaka"
        : city.toLowerCase() === "dhaka";
      const method = methods.find((m) =>
        isInsideDhaka
          ? m.name.toLowerCase().includes("inside")
          : m.name.toLowerCase().includes("outside"),
      );
      if (method) {
        this.checkoutForm.patchValue({ deliveryMethodId: method.id });
      }
    });
  }

  filterDistricts(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.districtSearch = query;
    this.filteredDistricts = this.districts().filter((d) =>
      d.nameEn.toLowerCase().includes(query),
    );
  }

  selectCity(city: string): void {
    this.checkoutForm.patchValue({ city });
    this.districtSearch = city;
    this.isDistrictDropdownOpen = false;
    const div = this.divisions().find((d) => d.nameEn === city);
    this.selectedDivisionId.set(div?.id);
    this.selectedDistrictId.set(undefined);
    this.selectedUpazilaId.set(undefined);
    this.loadDistrictsByCity(city);
  }

  toggleDistrictDropdown(): void {
    this.isDistrictDropdownOpen = !this.isDistrictDropdownOpen;
    if (this.isDistrictDropdownOpen) {
      this.isUpazilaDropdownOpen = false;
      this.filteredDistricts = [...this.districts()];
      this.districtSearch = this.checkoutForm.get("city")?.value || "";
    }
  }

  filterUpazilas(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.upazilaSearch = query;
    this.filteredUpazilas = this.upazilas().filter((u) =>
      u.nameEn.toLowerCase().includes(query),
    );
  }

  selectArea(area: string, districtId: number): void {
    this.checkoutForm.patchValue({ area });
    this.upazilaSearch = area;
    this.isUpazilaDropdownOpen = false;
    const dist = this.districts().find((d) => d.id === districtId);
    if (dist) {
      this.districtSearch = dist.nameEn;
    }
  }

  toggleUpazilaDropdown(): void {
    if (!this.checkoutForm.get("city")?.value) return;
    this.isUpazilaDropdownOpen = !this.isUpazilaDropdownOpen;
    if (this.isUpazilaDropdownOpen) {
      this.isDistrictDropdownOpen = false;
      this.filteredUpazilas = [...this.upazilas()];
      this.upazilaSearch = this.checkoutForm.get("area")?.value || "";
    }
  }

  onDistrictSelected(district: DistrictDto): void {
    this.checkoutForm.patchValue({ city: district.nameEn, area: "" });
    this.districtSearch = district.nameEn;
    this.isDistrictDropdownOpen = false;
    this.upazilaSearch = "";
    this.upazilas.set([]);
    this.filteredUpazilas = [];
    this.selectedDistrictId.set(district.id);
    this.selectedUpazilaId.set(undefined);
    this.locationService
      .getUpazilasByDistrict(district.id)
      .subscribe((upazilas) => {
        this.upazilas.set(upazilas);
        this.filteredUpazilas = [...upazilas];
      });
    this.updateDeliveryMethod(district.nameEn, "");
  }

  selectedDivisionId = signal<number | undefined>(undefined);
  selectedDistrictId = signal<number | undefined>(undefined);
  selectedUpazilaId = signal<number | undefined>(undefined);

  onUpazilaSelected(upazila: UpazilaDto): void {
    this.checkoutForm.patchValue({ area: upazila.nameEn });
    this.upazilaSearch = upazila.nameEn;
    this.isUpazilaDropdownOpen = false;
    this.selectedUpazilaId.set(upazila.id);
    const city = this.checkoutForm.controls.city.value;
    this.updateDeliveryMethod(city, upazila.nameEn);
  }

  getSelectedMethod(methods: DeliveryMethod[]): DeliveryMethod | undefined {
    const id = this.checkoutForm.get("deliveryMethodId")?.value;
    return methods.find((m) => m.id === id);
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
      divisionId: this.selectedDivisionId(),
      districtId: this.selectedDistrictId(),
      upazilaId: this.selectedUpazilaId(),
      deliveryMethodId: this.checkoutForm.controls.deliveryMethodId.value ?? undefined,
    });
  }
}
import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal } from "@angular/core";
import { AsyncPipe, DecimalPipe } from "@angular/common";
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
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { AuthService } from "../../../../core/services/auth.service";
import { DeliveryService } from "../../../../core/services/delivery.service";
import { SiteSettingsService, SiteSettings } from "../../../../core/services/site-settings.service";
import { AnalyticsService } from "../../../../core/services/analytics.service";
import { IncompleteOrderTrackerService } from "../../../../core/services/incomplete-order-tracker.service";
import { DeliveryMethod } from "../../../../core/models/delivery";
import { LocationService } from "../../../../core/services/location.service";
import { UserPersistenceService } from "../../../../core/services/user-persistence.service";
import { NotificationService } from "../../../../core/services/notification.service";
import {
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

  allDistricts = signal<DistrictDto[]>([]);
  upazilas = signal<UpazilaDto[]>([]);
  filteredDistricts: DistrictDto[] = [];
  filteredUpazilas: UpazilaDto[] = [];

  selectedDistrictId = signal<number | undefined>(undefined);
  selectedUpazilaId = signal<number | undefined>(undefined);

  isDistrictDropdownOpen = false;
  isUpazilaDropdownOpen = false;
  districtSearch = "";
  upazilaSearch = "";

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
    this.loadAllDistricts();

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
        if (state.districtId) {
          this.selectedDistrictId.set(state.districtId);
          this.loadUpazilasByDistrictId(state.districtId);
        }
        if (state.upazilaId) {
          this.selectedUpazilaId.set(state.upazilaId);
        }
        if (state.city) {
          this.updateDeliveryMethod(state.city, state.area || "");
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

    this.customerLookup
      .bindTo(this.checkoutForm.controls.phone.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((customer) => {
        if (customer) {
          this.didAutofill = true;

          if (customer.districtId) {
            const dist = this.allDistricts().find((d) => d.id === customer.districtId);
            if (dist) {
              this.selectedDistrictId.set(dist.id);
              this.checkoutForm.patchValue({ city: dist.nameEn }, { emitEvent: false });
              this.loadUpazilasByDistrictId(dist.id);

              if (customer.upazilaId) {
                this.locationService.getUpazilasByDistrict(dist.id).subscribe((upazilas) => {
                  const upazila = upazilas.find((u) => u.id === customer.upazilaId);
                  if (upazila) {
                    this.checkoutForm.patchValue({ area: upazila.id.toString() }, { emitEvent: false });
                    this.selectedUpazilaId.set(upazila.id);
                  }
                });
              }
            }
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
  }

  private loadAllDistricts(): void {
    this.locationService.getAllLocations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (hierarchy) => {
          const districts: DistrictDto[] = [];
          for (const div of hierarchy.divisions) {
            for (const dist of div.districts) {
              districts.push({
                id: dist.id,
                nameEn: dist.nameEn,
                nameBn: dist.nameBn,
                divisionId: div.id,
                displayOrder: dist.displayOrder,
                isActive: true,
              });
            }
          }
          this.allDistricts.set(districts);
          this.filteredDistricts = [...districts];
        },
        error: (err) => {
          console.error("Failed to load districts", err);
        },
      });
  }

  toggleDistrictDropdown(): void {
    this.isDistrictDropdownOpen = !this.isDistrictDropdownOpen;
    if (this.isDistrictDropdownOpen) {
      this.isUpazilaDropdownOpen = false;
      this.filteredDistricts = [...this.allDistricts()];
      this.districtSearch = "";
    }
  }

  filterDistricts(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.districtSearch = query;
    this.filteredDistricts = this.allDistricts().filter(
      (d) => d.nameBn.toLowerCase().includes(query) || d.nameEn.toLowerCase().includes(query)
    );
  }

  onDistrictSelected(district: DistrictDto): void {
    this.selectedDistrictId.set(district.id);
    this.selectedUpazilaId.set(undefined);
    this.checkoutForm.patchValue({ city: district.nameEn, area: "" });
    this.districtSearch = district.nameBn;
    this.isDistrictDropdownOpen = false;
    this.upazilas.set([]);
    this.filteredUpazilas = [];
    this.upazilaSearch = "";
    this.loadUpazilasByDistrictId(district.id);
    this.updateDeliveryMethod(district.nameEn, "");
  }

  toggleUpazilaDropdown(): void {
    if (!this.selectedDistrictId()) return;
    this.isUpazilaDropdownOpen = !this.isUpazilaDropdownOpen;
    if (this.isUpazilaDropdownOpen) {
      this.isDistrictDropdownOpen = false;
      this.filteredUpazilas = [...this.upazilas()];
      this.upazilaSearch = "";
    }
  }

  filterUpazilas(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.upazilaSearch = query;
    this.filteredUpazilas = this.upazilas().filter(
      (u) => u.nameBn.toLowerCase().includes(query) || u.nameEn.toLowerCase().includes(query)
    );
  }

  onUpazilaSelected(upazila: UpazilaDto): void {
    this.selectedUpazilaId.set(upazila.id);
    this.checkoutForm.patchValue({ area: upazila.nameEn });
    this.upazilaSearch = upazila.nameBn;
    this.isUpazilaDropdownOpen = false;
    const city = this.checkoutForm.controls.city.value;
    this.updateDeliveryMethod(city, upazila.nameEn);
  }

  closeDropdowns(): void {
    this.isDistrictDropdownOpen = false;
    this.isUpazilaDropdownOpen = false;
  }

  onDistrictChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const districtId = parseInt(select.value, 10);
    if (isNaN(districtId)) return;

    const district = this.allDistricts().find((d) => d.id === districtId);
    if (!district) return;

    this.selectedDistrictId.set(districtId);
    this.selectedUpazilaId.set(undefined);
    this.checkoutForm.patchValue({ city: district.nameEn, area: "" });
    this.loadUpazilasByDistrictId(districtId);
    this.updateDeliveryMethod(district.nameEn, "");
  }

  onUpazilaChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const upazilaId = parseInt(select.value, 10);
    if (isNaN(upazilaId)) return;

    const upazila = this.upazilas().find((u) => u.id === upazilaId);
    if (!upazila) return;

    this.selectedUpazilaId.set(upazilaId);
    this.checkoutForm.patchValue({ area: upazila.nameEn });
    const city = this.checkoutForm.controls.city.value;
    this.updateDeliveryMethod(city, upazila.nameEn);
  }

  private loadUpazilasByDistrictId(districtId: number): void {
    this.locationService.getUpazilasByDistrict(districtId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((upazilas) => {
        this.upazilas.set(upazilas);
      });
  }

  private updateDeliveryMethod(city: string, _area: string): void {
    this.deliveryMethods$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((methods) => {
      const district = this.allDistricts().find(
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

  updateQuantity(item: CartItem, delta: number): void {
    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) return;
    this.cartService.updateQty(item.id, newQuantity);
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.id);
  }

  applyAutofill(): void {
    const details = this.userPersistence.getUserDetails();
    if (details) {
      const city = details.city || "Dhaka";
      if (details.districtId) {
        this.selectedDistrictId.set(details.districtId);
        this.loadUpazilasByDistrictId(details.districtId);
      }
      if (details.area) {
        this.checkoutForm.patchValue({ area: details.area });
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
      districtId: this.selectedDistrictId(),
      upazilaId: this.selectedUpazilaId(),
      deliveryMethodId: this.checkoutForm.controls.deliveryMethodId.value ?? undefined,
    });
  }
}


import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { LucideAngularModule, ShoppingCart, Truck, Verified, RotateCcw, Clock, Search, Loader2, ChevronDown, User, Phone, MapPin } from "lucide-angular";
import { HttpClient } from "@angular/common/http";
import { combineLatest } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { Product } from "../../../../core/models/product";
import { CustomLandingPageConfig } from "../../../../admin/services/custom-landing-page.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { OrderService } from "../../../../core/services/order.service";
import { CartItem, CartSummary } from "../../../../core/models/cart";
import { Router } from "@angular/router";
import { SiteSettingsService } from "../../../../core/services/site-settings.service";
import { SettingsService } from "../../../../admin/services/settings.service";
import { DeliveryMethod } from "../../../../admin/models/settings.models";
import { map, catchError, takeUntil } from "rxjs";
import { ProductService } from "../../../../core/services/product.service";
import { of, Subject } from "rxjs";
import { BANGLADESH_LOCATIONS } from "../../../../core/utils/bangladesh-locations";
import { CustomerOrderApiService } from "../../../../core/services/customer-order-api.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DestroyRef } from "@angular/core";

interface LandingPageData {
  product: Product;
  config: CustomLandingPageConfig | null;
}

@Component({
  selector: "app-custom-landing-page",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule, PriceDisplayComponent],
  templateUrl: "./custom-landing-page.component.html",
  styleUrl: "./custom-landing-page.component.css"
})
export class CustomLandingPageComponent implements OnInit, OnDestroy {
  readonly icons = { ShoppingCart, Truck, Verified, RotateCcw, Clock, Search, Loader2, ChevronDown, User, Phone, MapPin };
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly settingsService = inject(SettingsService);
  private readonly productService = inject(ProductService);
  private readonly customerOrderApi = inject(CustomerOrderApiService);
  private readonly destroyRef = inject(DestroyRef);

  brandName$ = this.siteSettingsService.getSettings().pipe(map(s => s.websiteName));

  data: LandingPageData | null = null;
  relatedProducts: Product[] = [];
  deliveryMethods: DeliveryMethod[] = [];
  isLoading = true;
  isOrdering = false;
  timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  private timerInterval: any;

  readonly orderForm = this.fb.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    city: ["", [Validators.required]],
    area: ["", [Validators.required]],
    deliveryMethodId: [0, [Validators.required, Validators.min(1)]],
    selectedSize: ["", [Validators.required]],
    paymentMethod: ["cod", [Validators.required]]
  });

  cities = Object.keys(BANGLADESH_LOCATIONS).sort();
  filteredCities: string[] = [];
  citySearch = "";
  isCityDropdownOpen = false;

  areas: string[] = [];
  filteredAreas: string[] = [];
  areaSearch = "";
  isAreaDropdownOpen = false;

  didAutofill = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get("slug");
      if (slug) {
        this.loadData(slug);
        if (isPlatformBrowser(this.platformId)) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    });

    // Listen to city changes to update areas
    this.orderForm.controls.city.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((city) => {
        this.areas = BANGLADESH_LOCATIONS[city] || [];
        this.filteredAreas = [...this.areas];
        this.orderForm.patchValue({ area: "" });
        this.areaSearch = "";
        this.citySearch = city;
        this.updateDeliveryMethodByCity(city);
      });

    // Auto-lookup customer by phone
    this.orderForm.controls.phone.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
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
          this.orderForm.patchValue(
            {
              fullName: customer.name,
              address: customer.address,
            },
            { emitEvent: false },
          );
        }
      });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadData(slug: string): void {
    this.isLoading = true;
    combineLatest([
      this.http.get<LandingPageData>(`${environment.apiBaseUrl}/custom-landing-page/${slug}`),
      this.settingsService.getPublicDeliveryMethods()
    ]).subscribe({
      next: ([res, methods]) => {
        this.data = res;
        this.deliveryMethods = methods;
        this.isLoading = false;

        // Set default size (first default or first variant)
        if (res.product?.variants?.length > 0) {
          const defaultVariant = res.product.variants.find(v => v.isDefault) || res.product.variants[0];
          this.orderForm.patchValue({ selectedSize: defaultVariant.size || "" });
        }

        // Set default delivery method (first active one)
        if (methods.length > 0) {
          const firstActive = methods.find(m => m.isActive) || methods[0];
          this.orderForm.patchValue({ deliveryMethodId: firstActive.id });
        }

        // Start timer
        if (res.config?.relativeTimerTotalMinutes) {
          this.startRelativeTimer(res.config.productId, res.config.relativeTimerTotalMinutes);
        }

        // Load related products from same category
        if (res.product?.categoryId) {
          this.productService.getRelatedProducts(undefined, res.product.categoryId, 6)
            .subscribe({
              next: (related) => {
                // Filter out current product
                this.relatedProducts = related.data.filter(p => p.id !== res.product.id);
              }
            });
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  startRelativeTimer(productId: number, totalMinutes: number): void {
    if (isPlatformBrowser(this.platformId)) {
      const storageKey = `clp_timer_${productId}`;
      let endTimeStr = localStorage.getItem(storageKey);
      let endTime: number;

      if (!endTimeStr) {
        endTime = new Date().getTime() + totalMinutes * 60 * 1000;
        localStorage.setItem(storageKey, endTime.toString());
      } else {
        endTime = parseInt(endTimeStr, 10);
      }

      this.runTimer(endTime);
    }
  }

  private runTimer(endTime: number): void {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance < 0) {
        clearInterval(this.timerInterval);
        this.timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return;
      }

      this.timeLeft = {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    }, 1000);
  }

  /** Get the price for the currently selected size variant */
  get selectedVariantPrice(): number {
    const selectedSize = this.orderForm.get("selectedSize")?.value;
    const variant = this.data?.product?.variants?.find(v => v.size === selectedSize);
    // Variant price takes priority, then config promoPrice, then product base price
    return variant?.price || this.data?.config?.promoPrice || this.data?.product?.price || 0;
  }

  get selectedDeliveryMethod(): DeliveryMethod | null {
    const id = this.orderForm.get("deliveryMethodId")?.value;
    return this.deliveryMethods.find(m => m.id === id) || null;
  }

  get shippingCost(): number {
    return this.selectedDeliveryMethod?.cost ?? 0;
  }

  get total(): number {
    return this.selectedVariantPrice + this.shippingCost;
  }

  onSubmit(): void {
    if (this.orderForm.invalid || !this.data) {
      this.orderForm.markAllAsTouched();
      return;
    }

    this.isOrdering = true;
    const form = this.orderForm.getRawValue();
    const product = this.data.product;
    const method = this.selectedDeliveryMethod;

    const cartItem: CartItem = {
      id: "clp-" + Date.now(),
      productId: product.id,
      name: product.name,
      price: this.selectedVariantPrice,
      quantity: 1,
      size: form.selectedSize,
      imageUrl: product.imageUrl || "",
      imageAlt: product.name,
      discountPercentage: 0,
      compareAtPrice: this.data.config?.originalPrice || product.compareAtPrice
    };

    const subtotal = cartItem.price;
    const shipping = method?.cost ?? 0;

    const summary: CartSummary = {
      itemsCount: 1,
      subtotal,
      tax: 0,
      shipping,
      discount: cartItem.compareAtPrice ? cartItem.compareAtPrice - cartItem.price : 0,
      total: subtotal + shipping,
      freeShippingThreshold: 0,
      freeShippingRemaining: 0,
      freeShippingProgress: 100
    };

    this.orderService.placeOrder({
      state: {
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        city: method?.name || "",
        area: "",
        deliveryMethodId: form.deliveryMethodId
      },
      cartItems: [cartItem],
      summary,
      deliveryMethodId: form.deliveryMethodId
    }).subscribe({
      next: (order) => {
        this.isOrdering = false;
        if (order?.id) {
          this.router.navigate(["/order-confirmation", order.id]);
        }
      },
      error: () => {
        this.isOrdering = false;
      }
    });
  }

  selectSize(size: string): void {
    this.orderForm.patchValue({ selectedSize: size });
  }

  selectDeliveryMethod(id: number): void {
    this.orderForm.patchValue({ deliveryMethodId: id });
  }

  toggleCityDropdown(): void {
    this.isCityDropdownOpen = !this.isCityDropdownOpen;
    if (this.isCityDropdownOpen) {
      this.isAreaDropdownOpen = false;
      this.filteredCities = [...this.cities];
      this.citySearch = this.orderForm.get('city')?.value || "";
    }
  }

  selectCity(city: string): void {
    this.orderForm.patchValue({ city });
    this.citySearch = city;
    this.isCityDropdownOpen = false;
  }

  filterCities(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.citySearch = query;
    this.filteredCities = this.cities.filter(c => c.toLowerCase().includes(query));
  }

  toggleAreaDropdown(): void {
    if (!this.orderForm.get('city')?.value) return;
    this.isAreaDropdownOpen = !this.isAreaDropdownOpen;
    if (this.isAreaDropdownOpen) {
      this.isCityDropdownOpen = false;
      this.filteredAreas = [...this.areas];
      this.areaSearch = this.orderForm.get('area')?.value || "";
    }
  }

  selectArea(area: string): void {
    this.orderForm.patchValue({ area });
    this.areaSearch = area;
    this.isAreaDropdownOpen = false;
  }

  filterAreas(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.areaSearch = query;
    this.filteredAreas = this.areas.filter(a => a.toLowerCase().includes(query));
  }

  private updateDeliveryMethodByCity(city: string): void {
    const isDhaka = city.toLowerCase() === "dhaka";
    const method = this.deliveryMethods.find((m) =>
      isDhaka
        ? m.name.toLowerCase().includes("inside")
        : m.name.toLowerCase().includes("outside"),
    );
    if (method) {
      this.orderForm.patchValue({ deliveryMethodId: method.id });
    }
  }

  scrollToOrder(): void {
    const el = document.getElementById("order-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  formatSizes(variants: any[] | undefined): string {
    if (!variants) return "";
    return Array.from(new Set(variants.map(v => v.size).filter(Boolean))).join(", ");
  }
}

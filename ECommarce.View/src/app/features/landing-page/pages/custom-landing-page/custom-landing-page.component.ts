import { AsyncPipe, NgClass, isPlatformBrowser, NgIf, DecimalPipe } from "@angular/common";
import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { HttpClient } from "@angular/common/http";
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
import { ProductService } from "../../../../core/services/product.service";
import { of, combineLatest } from "rxjs";
import { map, catchError, debounceTime, distinctUntilChanged, filter, switchMap } from "rxjs/operators";
import { BANGLADESH_LOCATIONS } from "../../../../core/utils/bangladesh-locations";
import { CustomerOrderApiService } from "../../../../core/services/customer-order-api.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DestroyRef } from "@angular/core";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";
import { UserPersistenceService } from "../../../../core/services/user-persistence.service";
import { NotificationService } from "../../../../core/services/notification.service";
import { SafeHtmlPipe } from "../../../../shared/pipes/safe-html.pipe";

interface LandingPageData {
  product: Product;
  config: CustomLandingPageConfig | null;
}

@Component({
  selector: "app-custom-landing-page",
  standalone: true,
  imports: [AsyncPipe, NgClass, ReactiveFormsModule, RouterModule, AppIconComponent, SafeHtmlPipe, DecimalPipe],
  templateUrl: "./custom-landing-page.component.html",
  styleUrl: "./custom-landing-page.component.css"
})
export class CustomLandingPageComponent implements OnInit, OnDestroy {
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
  private readonly userPersistence = inject(UserPersistenceService);
  private readonly notification = inject(NotificationService);

  brandName$ = this.siteSettingsService.getSettings().pipe(map(s => s.websiteName));

  data: LandingPageData | null = null;
  relatedProducts: Product[] = [];
  deliveryMethods: DeliveryMethod[] = [];
  isLoading = true;
  isOrdering = false;

  get processedMarqueeText(): string {
    if (!this.data?.config?.marqueeText) return "";
    
    let text = this.data.config.marqueeText;
    const discount = this.discountPercentage;
    
    if (discount > 0) {
      text = text.replace('{discount}', `${discount}%`);
    } else {
      text = text.replace('{discount}', '');
    }
    
    return text;
  }

  get discountPercentage(): number {
    if (!this.data?.config) return 0;
    const original = this.data.config.originalPrice || this.data.product.price;
    const promo = this.data.config.promoPrice || this.data.product.price;
    
    if (original > promo) {
      return Math.round(((original - promo) / original) * 100);
    }
    return 0;
  }

  timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  private timerInterval: any;
  selectedImage: string = "";
  slideProgress = 0;
  private autoSlideInterval: any;
  showAutofillPrompt = false;

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
      .subscribe((customer: any) => {
        if (customer) {
          this.didAutofill = true;
          
          if (customer.city) {
            this.areas = BANGLADESH_LOCATIONS[customer.city] || [];
            this.filteredAreas = [...this.areas];
            this.citySearch = customer.city;
            this.updateDeliveryMethodByCity(customer.city);
          }

          this.orderForm.patchValue(
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
        }
      });

    this.orderForm.controls.address.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((address) => {
        if (!address || address.length < 3) return;
        this.intelligentLocationMatch(address);
      });

    // Check for local saved details
    if (this.userPersistence.hasSavedDetails()) {
      this.showAutofillPrompt = true;
    }
  }

  intelligentLocationMatch(address: string): void {
    const addr = address.toLowerCase();
    
    // Check for cities first
    for (const city of this.cities) {
      if (addr.includes(city.toLowerCase())) {
        if (this.orderForm.get("city")?.value !== city) {
          this.selectCity(city);
        }
        break; 
      }
    }

    // Check for areas
    const currentCity = this.orderForm.get("city")?.value;
    if (currentCity) {
      const cityAreas = BANGLADESH_LOCATIONS[currentCity] || [];
      for (const area of cityAreas) {
        if (addr.includes(area.toLowerCase())) {
          if (this.orderForm.get("area")?.value !== area) {
            this.selectArea(area);
          }
          break;
        }
      }
    } else {
      // If no city selected yet, check all areas across all cities
      for (const city of this.cities) {
        const cityAreas = BANGLADESH_LOCATIONS[city] || [];
        for (const area of cityAreas) {
          if (addr.includes(area.toLowerCase())) {
            this.selectCity(city);
            this.selectArea(area);
            return;
          }
        }
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

      this.orderForm.patchValue({
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

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
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

        if (res.product?.variants?.length > 0) {
          const defaultVariant = res.product.variants.find(v => v.isDefault) || res.product.variants[0];
          this.orderForm.patchValue({ selectedSize: defaultVariant.size || "" });
        }

        if (methods.length > 0) {
          const firstActive = methods.find(m => m.isActive) || methods[0];
          this.orderForm.patchValue({ deliveryMethodId: firstActive.id });
        }

        if (res.config?.relativeTimerTotalMinutes) {
          this.startRelativeTimer(res.config.productId, res.config.relativeTimerTotalMinutes);
        }

        if (res.product?.categoryId) {
          this.productService.getRelatedProducts(undefined, res.product.categoryId, 6)
            .subscribe({
              next: (related) => {
                this.selectedImage = res.product.imageUrl || "";
                this.relatedProducts = related.data.filter(p => p.id !== res.product.id);
                this.startAutoSlide();
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

  get selectedVariantPrice(): number {
    const selectedSize = this.orderForm.get("selectedSize")?.value;
    const variant = this.data?.product?.variants?.find(v => v.size === selectedSize);
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
      next: (order: any) => {
        this.isOrdering = false;
        if (order?.id) {
          // Save user details for next time
          this.userPersistence.saveUserDetails({
            fullName: form.fullName,
            phone: form.phone,
            address: form.address,
            city: form.city,
            area: form.area
          });
          void this.router.navigate(["/order-confirmation", order.id]);
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

  startAutoSlide(): void {
    if (this.autoSlideInterval) clearInterval(this.autoSlideInterval);
    if (!this.data?.product?.images || this.data.product.images.length <= 1) return;

    const step = 100 / (4000 / 50);
    this.autoSlideInterval = setInterval(() => {
      this.slideProgress += step;
      if (this.slideProgress >= 100) {
        const images = this.data!.product.images;
        const currentIndex = images.findIndex(img => img.imageUrl === this.selectedImage);
        const nextIndex = (currentIndex + 1) % images.length;
        this.selectedImage = images[nextIndex].imageUrl;
        this.slideProgress = 0;
      }
    }, 50);
  }

  selectImage(url: string): void {
    this.selectedImage = url;
    this.slideProgress = 0;
  }

  scrollToOrder(): void {
    const el = document.getElementById("order-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  whatsappUs(): void {
    if (!this.data) return;
    this.siteSettingsService.getSettings().subscribe(settings => {
      const phone = (settings.whatsAppNumber || settings.contactPhone || "").replace(/\D/g, "");
      const message = encodeURIComponent(`Hello, I'm interested in ${this.data?.product.name}. Can you help me?`);
      if (phone) {
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      }
    });
  }

  formatSizes(variants: any[] | undefined): string {
    if (!variants) return "";
    return Array.from(new Set(variants.map(v => v.size).filter(Boolean))).join(", ");
  }
}

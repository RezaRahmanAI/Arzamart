import { AsyncPipe, NgClass, isPlatformBrowser, NgIf, DecimalPipe, DatePipe, NgFor, TitleCasePipe } from "@angular/common";
import { CdkDragDrop, moveItemInArray, DragDropModule } from "@angular/cdk/drag-drop";
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
import { Review } from "../../../../core/models/review";
import { ReviewService } from "../../../../core/services/review.service";
import { UserPersistenceService } from "../../../../core/services/user-persistence.service";
import { NotificationService } from "../../../../core/services/notification.service";
import { SafeHtmlPipe } from "../../../../shared/pipes/safe-html.pipe";
import { QuickAddModalComponent } from "../../../../shared/components/quick-add-modal/quick-add-modal.component";
import { matchLocationFromAddress } from "../../../../core/utils/location-matcher";
import { AuthService } from "../../../../core/services/auth.service";

interface LandingSection {
  id: string;
  type: string;
  label: string;
  visible: boolean;
}

interface LandingPageData {
  product: Product;
  config: CustomLandingPageConfig | null;
}

@Component({
  selector: "app-custom-landing-page",
  standalone: true,
  imports: [AsyncPipe, NgClass, ReactiveFormsModule, RouterModule, AppIconComponent, SafeHtmlPipe, DecimalPipe, DatePipe, NgFor, QuickAddModalComponent, NgIf, TitleCasePipe, DragDropModule],
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
  private readonly authService = inject(AuthService);
  private readonly reviewService = inject(ReviewService);

  brandName$ = this.siteSettingsService.getSettings().pipe(map(s => s.websiteName));
  isAdmin$ = this.authService.currentUser.pipe(
    map(user => 
      user?.role === 'Admin' || 
      user?.role === 'SuperAdmin' || 
      (user?.role === 'Staff' && user.allowedMenus?.includes('products'))
    )
  );

  isEditorOpen = false;
  isSaving = false;
  activeEditorSection: string = 'global';

  sharePageLink(): void {
    if (typeof window !== 'undefined') {
      const url = window.location.href.split('?')[0]; // Clean URL without query params
      navigator.clipboard.writeText(url).then(() => {
        this.notification.success('Link copied to clipboard! You can now share it with customers.');
      }).catch(() => {
        this.notification.error('Failed to copy link.');
      });
    }
  }
  
  sections: LandingSection[] = [
    { id: 'countdown',      type: 'countdown',      label: '⏱ Countdown Bar',       visible: true },
    { id: 'hero',           type: 'hero',           label: '🎯 Hero / Offer',         visible: true },
    { id: 'product-hero',   type: 'product-hero',   label: '🛍 Product Hero',         visible: true },
    { id: 'ad-banners',     type: 'ad-banners',     label: '🖼 Ad Banners',           visible: true },
    { id: 'discount-cta',   type: 'discount-cta',   label: '💚 Discount CTA',         visible: true },
    { id: 'info-banner',    type: 'info-banner',    label: '🟡 Info Banner',          visible: true },
    { id: 'product-select', type: 'product-select', label: '📦 Product Selection',    visible: true },
    { id: 'product-details',type: 'product-details', label: 'ℹ️ Product Details',     visible: true },
    { id: 'trust-banner',   type: 'trust-banner',   label: '🛡️ Trust Banner',        visible: true },
    { id: 'reviews',        type: 'reviews',        label: '💬 Customer Reviews',     visible: false },
    { id: 'order-form',     type: 'order-form',     label: '📝 Order Form',           visible: true },
  ];

  data: LandingPageData | null = null;
  relatedProducts: Product[] = [];
  productReviews: Review[] = [];
  deliveryMethods: DeliveryMethod[] = [];
  isLoading = true;
  isOrdering = false;
  watchingCount: number = Math.floor(Math.random() * (45 - 15 + 1) + 15);

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
  private watchingInterval: any;
  showAutofillPrompt = false;
  selectedQuickProduct: Product | null = null;
  showQuickAdd = false;

  readonly orderForm = this.fb.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    city: ["", [Validators.required]],
    area: ["", [Validators.required]],
    deliveryMethodId: [0, [Validators.required, Validators.min(1)]],
    selectedSize: ["", [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    paymentMethod: ["cod", [Validators.required]]
  });

  readonly configForm = this.fb.nonNullable.group({
    relativeTimerTotalMinutes: [null as number | null],
    isTimerVisible: [true],
    headerTitle: ["অফারটি শেষ হতে মাত্র কিছুক্ষণ বাকি আছে!"],
    isProductDetailsVisible: [true],
    productDetailsTitle: ["🔥 প্রোডাক্ট ডিটেইলস"],
    isFabricVisible: [true],
    isDesignVisible: [true],
    isTrustBannerVisible: [true],
    trustBannerText: ["দেখে চেক করে রিসিভ করতে পারবেন। পছন্দ না হলে ডেলিভারি চার্জ দিয়ে রিটার্ন করে দিতে পারবেন সহজেই"],
    featuredProductName: [""],
    promoPrice: [0],
    originalPrice: [0],
    isMarqueeVisible: [false],
    marqueeText: ["🔥 সীমিত স্টক — মাত্র ৩৪টি বাকি! 🚚 সারা বাংলাদেশে ফ্রি ডেলিভারি 💥 আজকের জন্য ৩০% ছাড় — মধ্যরাতে শেষ 💵 ক্যাশ অন ডেলিভারি আছে ⚡"],
    promoText: ["যেকোনো কালার যেকোনো সাইজ দুই পিস অর্ডার করলেই পাচ্ছেন মাত্র ১৪৫০ টাকা"],
    freeShippingThresholdQuantity: [null as number | null],
    isReviewsVisible: [true],
    heroTitle: ["একচেটিয়া অফার! আজকের জন্যই সেরা সুযোগ"],
    heroSubtitle: ["প্রিমিয়াম কোয়ালিটি এখন সাশ্রয়ী মূল্যে"],
    heroBadge: ["স্টক ফুরিয়ে যাওয়ার আগেই সংগ্রহ করুন"],
    productHeroTitle: ["আমাদের প্রিমিয়াম প্রসাধনী"],
    productHeroDescription: ["সেরা উপাদান দিয়ে তৈরি যা আপনার ত্বকের যত্ন নেবে। আমাদের হাজার হাজার সন্তুষ্ট গ্রাহকের তালিকায় আপনিও যুক্ত হোন।"],
    discountCtaTitle: ["অবিশ্বাস্য ডিসকাউন্ট অফার!"],
    discountCtaDescription: ["আপনি কি সেরা কোয়ালিটির পণ্যটি খুঁজছেন? আজই অর্ডার করলে পাবেন বিশেষ ছাড় এবং ফ্রি ডেলিভারি।"],
    infoBannerTitle: ["প্রোডাক্ট ব্যবহারের নিয়মাবলী"],
    infoBannerDescription: ["প্রতিদিন সকালে ও রাতে পরিষ্কার ত্বকে অল্প পরিমাণে ক্রিম লাগিয়ে আলতোভাবে ম্যাসাজ করুন। নিয়মিত ব্যবহারে আপনি দৃশ্যমান পরিবর্তন লক্ষ্য করবেন। আমাদের পণ্যগুলি ১০০% প্রাকৃতিক উপাদান দিয়ে তৈরি।"],
    sectionsJson: [""],
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
        const queryParams = this.route.snapshot.queryParamMap;
        const qSize = queryParams.get('qSize');
        const qQty = queryParams.get('qQty');
        const shouldEdit = queryParams.get('edit') === 'true';

        if (qSize) this.orderForm.patchValue({ selectedSize: qSize });
        if (qQty) this.orderForm.patchValue({ quantity: parseInt(qQty, 10) || 1 });
        if (shouldEdit) this.isEditorOpen = true;

        if (isPlatformBrowser(this.platformId)) window.scrollTo({ top: 0, behavior: "smooth" });
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
          this.customerOrderApi.lookupCustomer(phone).pipe(catchError(() => of(null))),
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
          this.orderForm.patchValue({
            fullName: customer.name,
            address: customer.address,
            city: customer.city || "Dhaka",
            area: customer.area || ""
          }, { emitEvent: false });
          if (customer.area) this.areaSearch = customer.area;
        }
      });

    this.orderForm.controls.address.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((address) => {
        if (!address || address.length < 3) return;
        this.intelligentLocationMatch(address);
      });

    if (this.userPersistence.hasSavedDetails()) this.showAutofillPrompt = true;
    this.startWatchingFluctuation();
  }

  private startWatchingFluctuation(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.watchingInterval = setInterval(() => {
        const change = Math.floor(Math.random() * 5) - 2;
        this.watchingCount = Math.max(12, Math.min(65, this.watchingCount + change));
      }, 7000);
    }
  }

  intelligentLocationMatch(address: string): void {
    const { city, area } = matchLocationFromAddress(address, this.cities);
    if (city) {
      if (this.orderForm.get("city")?.value !== city) this.selectCity(city);
      if (area && this.orderForm.get("area")?.value !== area) this.selectArea(area);
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
      if (details.area) this.areaSearch = details.area;
      this.showAutofillPrompt = false;
      this.notification.success("Information filled successfully!");
    }
  }

  dismissAutofill(): void {
    this.showAutofillPrompt = false;
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.autoSlideInterval) clearInterval(this.autoSlideInterval);
    if (this.watchingInterval) clearInterval(this.watchingInterval);
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
        if (res.config?.sectionsJson) {
          try {
            this.sections = JSON.parse(res.config.sectionsJson);
          } catch (e) { console.error('Failed to parse sectionsJson', e); }
        }
        if (res.product?.variants?.length > 0) {
          const defaultVariant = res.product.variants.find(v => v.isDefault) || res.product.variants[0];
          this.orderForm.patchValue({ selectedSize: defaultVariant.size || "" });
        }
        if (methods.length > 0) {
          const firstActive = methods.find(m => m.isActive) || methods[0];
          this.orderForm.patchValue({ deliveryMethodId: firstActive.id });
        }
        if (res.config) {
          this.configForm.patchValue({
            ...res.config,
            featuredProductName: res.config.featuredProductName || res.product.name,
            promoPrice: res.config.promoPrice || res.product.price,
            originalPrice: res.config.originalPrice || res.product.compareAtPrice || res.product.price
          });
          if (res.config.relativeTimerTotalMinutes) {
            this.startRelativeTimer(res.config.productId, res.config.relativeTimerTotalMinutes);
          }
        }
        if (res.product?.id) {
          this.reviewService.getReviewsByProductId(res.product.id).subscribe(reviews => {
            this.productReviews = reviews;
          });
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
      error: () => this.isLoading = false
    });
  }

  startRelativeTimer(productId: number, totalMinutes: number): void {
    if (isPlatformBrowser(this.platformId)) {
      const storageKey = `clp_timer_${productId}`;
      const minutesKey = `clp_timer_mins_${productId}`;
      
      let endTimeStr = localStorage.getItem(storageKey);
      let storedMins = localStorage.getItem(minutesKey);
      let endTime: number;
      const now = new Date().getTime();

      // Reset timer if:
      // 1. No previous end time
      // 2. Previous end time has passed
      // 3. The configured total minutes has changed
      if (!endTimeStr || (parseInt(endTimeStr, 10) < now) || (storedMins !== totalMinutes.toString())) {
        endTime = now + (totalMinutes || 180) * 60 * 1000;
        localStorage.setItem(storageKey, endTime.toString());
        localStorage.setItem(minutesKey, totalMinutes.toString());
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

  get selectedVariantStock(): number {
    const selectedSize = this.orderForm.get("selectedSize")?.value;
    if (selectedSize) {
      const variant = this.data?.product?.variants?.find(v => v.size === selectedSize);
      return variant?.stockQuantity || 0;
    }
    return this.data?.product?.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) || this.data?.product?.stockQuantity || 0;
  }

  get selectedVariantDiscountAmount(): number {
    const selectedSize = this.orderForm.get("selectedSize")?.value;
    const variant = this.data?.product?.variants?.find(v => v.size === selectedSize);
    const price = this.selectedVariantPrice;
    const comparePrice = variant?.compareAtPrice || this.data?.config?.originalPrice || this.data?.product?.compareAtPrice || 0;
    return comparePrice > price ? (comparePrice - price) : 0;
  }

  get selectedDeliveryMethod(): DeliveryMethod | null {
    const id = this.orderForm.get("deliveryMethodId")?.value;
    return this.deliveryMethods.find(m => m.id === id) || null;
  }

  get shippingCost(): number {
    const qty = this.orderForm.get("quantity")?.value || 1;
    const threshold = this.data?.config?.freeShippingThresholdQuantity;
    if (threshold && qty >= threshold) return 0;
    return this.selectedDeliveryMethod?.cost ?? 0;
  }

  get total(): number {
    const qty = this.orderForm.get("quantity")?.value || 1;
    return (this.selectedVariantPrice * qty) + this.shippingCost;
  }

  get uniqueSizes(): string[] {
    if (!this.data?.product?.variants) return [];
    return Array.from(new Set(this.data.product.variants.map(v => v.size).filter(Boolean))) as string[];
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
      quantity: form.quantity,
      size: form.selectedSize,
      imageUrl: product.imageUrl || "",
      imageAlt: product.name,
      discountPercentage: 0,
      compareAtPrice: this.data.config?.originalPrice || product.compareAtPrice
    };
    const subtotal = cartItem.price * form.quantity;
    const shipping = this.shippingCost;
    const summary: CartSummary = {
      itemsCount: form.quantity,
      subtotal,
      tax: 0,
      shipping,
      discount: cartItem.compareAtPrice ? (cartItem.compareAtPrice - cartItem.price) * form.quantity : 0,
      total: subtotal + shipping,
      freeShippingThreshold: 0,
      freeShippingRemaining: 0,
      freeShippingProgress: 100
    };
    this.orderService.placeOrder({
      state: { fullName: form.fullName, phone: form.phone, address: form.address, city: method?.name || "", area: "", deliveryMethodId: form.deliveryMethodId },
      cartItems: [cartItem],
      summary,
      deliveryMethodId: form.deliveryMethodId
    }).subscribe({
      next: (order: any) => {
        this.isOrdering = false;
        if (order?.id) {
          this.userPersistence.saveUserDetails({ fullName: form.fullName, phone: form.phone, address: form.address, city: form.city, area: form.area });
          void this.router.navigate(["/order-confirmation", order.id]);
        }
      },
      error: () => this.isOrdering = false
    });
  }

  selectSize(size: string): void { this.orderForm.patchValue({ selectedSize: size }); }
  updateQuantity(delta: number): void {
    const current = this.orderForm.get("quantity")?.value || 1;
    this.orderForm.patchValue({ quantity: Math.max(1, current + delta) });
  }
  selectDeliveryMethod(id: number): void { this.orderForm.patchValue({ deliveryMethodId: id }); }

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
      isDhaka ? m.name.toLowerCase().includes("inside") : m.name.toLowerCase().includes("outside"),
    );
    if (method) this.orderForm.patchValue({ deliveryMethodId: method.id });
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

  selectImage(url: string): void { this.selectedImage = url; this.slideProgress = 0; }
  scrollToOrder(): void {
    const el = document.getElementById("order-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  whatsappUs(): void {
    if (!this.data) return;
    this.siteSettingsService.getSettings().subscribe(settings => {
      const phone = (settings.whatsAppNumber || settings.contactPhone || "").replace(/\D/g, "");
      const message = encodeURIComponent(`Hello, I'm interested in ${this.data?.product.name}. Can you help me?`);
      if (phone) window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    });
  }

  formatSizes(variants: any[] | undefined): string {
    if (!variants) return "";
    return Array.from(new Set(variants.map(v => v.size).filter(Boolean))).join(", ");
  }

  openQuickAdd(product: Product, event: Event): void {
    event.preventDefault(); event.stopPropagation();
    this.selectedQuickProduct = product; this.showQuickAdd = true;
  }

  onQuickAddConfirm(selection: { size?: string; quantity: number }): void {
    if (this.selectedQuickProduct) {
      const queryParams: any = {};
      if (selection.size) queryParams.qSize = selection.size;
      if (selection.quantity > 1) queryParams.qQty = selection.quantity;
      this.showQuickAdd = false;
      void this.router.navigate(['/clp', this.selectedQuickProduct.slug], { queryParams, queryParamsHandling: 'merge' }).then(() => this.scrollToOrder());
    } else this.showQuickAdd = false;
  }

  // --- MODULAR SECTION MANAGEMENT ---
  moveSection(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.sections[index], this.sections[index-1]] = [this.sections[index-1], this.sections[index]];
    } else if (direction === 'down' && index < this.sections.length - 1) {
      [this.sections[index], this.sections[index+1]] = [this.sections[index+1], this.sections[index]];
    }
  }

  drop(event: CdkDragDrop<LandingSection[]>): void {
    moveItemInArray(this.sections, event.previousIndex, event.currentIndex);
  }

  toggleVisibility(index: number): void { this.sections[index].visible = !this.sections[index].visible; }
  deleteSection(index: number): void { if (confirm('Delete this section?')) this.sections.splice(index, 1); }
  
  addSection(type: string): void {
    const labels: Record<string, string> = {
      'countdown': '⏱ Countdown Bar',
      'hero': '🎯 Hero / Offer',
      'product-hero': '🛍 Product Hero',
      'discount-cta': '💚 Discount CTA',
      'info-banner': '🟡 Info Banner',
      'product-details': 'ℹ️ Product Details',
      'trust-banner': '🛡️ Trust Banner',
      'product-select': '📦 Product Selection',
      'reviews': '💬 Customer Reviews',
      'order-form': '📝 Order Form'
    };
    this.sections.push({ id: `${type}_${Date.now()}`, type, label: labels[type] || 'New Section', visible: true });
  }

  saveLayout(): void {
    if (!this.data) return;
    this.isSaving = true;
    
    const formValue = this.configForm.getRawValue();
    const config: CustomLandingPageConfig = {
      ...formValue,
      productId: this.data.product.id,
      sectionsJson: JSON.stringify(this.sections),
      relativeTimerTotalMinutes: formValue.relativeTimerTotalMinutes ?? undefined
    };

    this.http.post(`${environment.apiBaseUrl}/admin/custom-landing-page`, config).subscribe({
      next: () => { 
        this.isSaving = false; 
        this.notification.success('Landing Page Updated!'); 
        if (this.data) this.data.config = config;
      },
      error: () => { 
        this.isSaving = false; 
        this.notification.error('Update failed.'); 
      }
    });
  }
}

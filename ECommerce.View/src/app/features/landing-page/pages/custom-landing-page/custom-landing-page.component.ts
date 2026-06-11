import { AsyncPipe, NgClass, isPlatformBrowser, NgIf, DecimalPipe, DatePipe, NgFor, TitleCasePipe } from "@angular/common";
import { CdkDragDrop, moveItemInArray, DragDropModule } from "@angular/cdk/drag-drop";
import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../../environments/environment";
import { Product, ProductVariant } from "../../../../core/models/product";
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
import { of, combineLatest, forkJoin } from "rxjs";
import { map, catchError, debounceTime, distinctUntilChanged, filter, switchMap, tap } from "rxjs/operators";
import { BANGLADESH_LOCATIONS } from "../../../../core/utils/bangladesh-locations";
import { OrderApiService, CustomerLookupResponse } from "../../../../core/services/order-api.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DestroyRef } from "@angular/core";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";
import { Review } from "../../../../core/models/review";
import { sortProductSizes } from "../../../../core/constants/product.constants";
import { ReviewService } from "../../../../core/services/review.service";
import { UserPersistenceService } from "../../../../core/services/user-persistence.service";
import { NotificationService } from "../../../../core/services/notification.service";
import { Order } from "../../../../core/models/order";
import { SafeHtmlPipe } from "../../../../shared/pipes/safe-html.pipe";
import { QuickAddModalComponent } from "../../../../shared/components/quick-add-modal/quick-add-modal.component";
import { matchLocationFromAddress } from "../../../../core/utils/location-matcher";
import { AuthService } from "../../../../core/services/auth.service";

interface LandingSection {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  settings?: any;
}

interface LandingPageData {
  product: Product;
  config: CustomLandingPageConfig | null;
  relatedProducts?: Product[];
}

@Component({
  selector: "app-custom-landing-page",
  standalone: true,
  imports: [AsyncPipe, NgClass, FormsModule, ReactiveFormsModule, RouterModule, AppIconComponent, SafeHtmlPipe, DecimalPipe, DatePipe, NgFor, QuickAddModalComponent, NgIf, TitleCasePipe, DragDropModule],
  templateUrl: "./custom-landing-page.component.html",
  styleUrl: "./custom-landing-page.component.css"
})
export class CustomLandingPageComponent implements OnInit, OnDestroy {
  private static readonly dataCache = new Map<string, { data: LandingPageData; expires: number }>();
  private static readonly CACHE_TTL = 60 * 60 * 1000;

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
  private readonly orderApi = inject(OrderApiService);
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
  isEditMode = false;
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

  // Custom Selection for Editor
  allProducts: Product[] = [];
  defaultRelatedProducts: Product[] = []; // Pool of related products for easy selection
  productSearchTerm = "";
  isProductSelectionLoading = false;

  productSelections: { [id: number]: { quantity: number; selectedSize: string; product: Product } } = {};
  showDetailsModal = false;
  selectedProductForDetails: Product | null = null;

  isProductSelected(product: Product): boolean {
    return (this.productSelections[product.id]?.quantity ?? 0) > 0;
  }

  getProductQuantity(product: Product): number {
    return this.productSelections[product.id]?.quantity ?? 0;
  }

  getSelectedSize(product: Product): string {
    return this.productSelections[product.id]?.selectedSize ?? "";
  }

  private updateSelections(product: Product, quantity: number, size?: string): void {
    if (!this.productSelections[product.id]) {
      this.productSelections[product.id] = {
        quantity: 0,
        selectedSize: size || "",
        product: product
      };
    }
    
    if (size !== undefined) {
      this.productSelections[product.id].selectedSize = size;
    }
    
    this.productSelections[product.id].quantity = quantity;
  }

  get selectedProductList() {
    return Object.values(this.productSelections).filter(s => s.quantity > 0);
  }

  openProductDetails(product: Product): void {
    this.selectedProductForDetails = product;
    this.showDetailsModal = true;
  }

  onModalConfirm(selection: { size?: string; quantity: number }): void {
    if (this.selectedProductForDetails) {
      this.updateSelections(this.selectedProductForDetails, selection.quantity, selection.size);
    }
    this.showDetailsModal = false;
  }

  updateProductQuantity(product: Product, delta: number): void {
    const current = this.productSelections[product.id]?.quantity || 0;
    const newQty = Math.max(0, current + delta);
    this.updateSelections(product, newQty);
  }

  toggleProductCheck(product: Product): void {
    const hasVariants = (product.variants?.length ?? 0) > 0;
    const currentQty = this.productSelections[product.id]?.quantity ?? 0;
    const currentSize = this.productSelections[product.id]?.selectedSize ?? "";

    if (currentQty > 0) {
      this.updateSelections(product, 0);
      return;
    }

    const size = currentSize || (hasVariants ? this.getUniqueSizes(product)[0] || "" : "");
    this.updateSelections(product, 1, size);
  }

  selectProductSize(product: Product, size: string): void {
    this.updateSelections(product, this.productSelections[product.id]?.quantity || 0, size);
    if ((this.productSelections[product.id]?.quantity ?? 0) === 0) {
      this.updateSelections(product, 1, size);
    }
  }

  switchProduct(product: Product): void {
    // Legacy support for older sections if needed, but primarily we use updateSelections now
    if (this.productSelections[product.id]?.quantity === 0) {
      this.updateSelections(product, 1);
    }
    this.selectedImage = product.imageUrl || "";
  }

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
  private timerInterval: ReturnType<typeof setInterval> | undefined;
  selectedImage: string = "";
  slideProgress = 0;
  private autoSlideInterval: ReturnType<typeof setInterval> | undefined;
  private watchingInterval: ReturnType<typeof setInterval> | undefined;
  showAutofillPrompt = false;
  userSelectedDeliveryMethod = false;
  selectedQuickProduct: Product | null = null;
  showQuickAdd = false;

  readonly orderForm = this.fb.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    city: [""],
    area: [""],
    deliveryMethodId: [0, [Validators.required, Validators.min(1)]],
    selectedSize: [""],
    quantity: [1],
    paymentMethod: ["cod"]
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
  isAddSectionMenuOpen = false;

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
        this.isEditMode = shouldEdit;

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
        this.updateDeliveryMethod(city, "");
      });

    this.orderForm.controls.area.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((area) => {
        const city = this.orderForm.controls.city.value;
        this.updateDeliveryMethod(city, area);
      });

    this.orderForm.controls.phone.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((value) => value.length >= 7),
        switchMap((phone) =>
          this.orderApi.lookupCustomer(phone).pipe(catchError(() => of(null))),
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
            if (!this.userSelectedDeliveryMethod) {
              this.updateDeliveryMethod(customer.city, customer.area || "");
            }
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
        if (!this.userSelectedDeliveryMethod) {
          this.updateDeliveryMethod(details.city, details.area || "");
        }
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

    const cacheKey = `clp_${slug}`;
    const cached = CustomLandingPageComponent.dataCache.get(cacheKey);
    const mainData$ = cached && Date.now() < cached.expires
      ? of(cached.data)
      : this.http.get<LandingPageData>(`${environment.apiBaseUrl}/custom-landing-page/${slug}`).pipe(
          tap(data => CustomLandingPageComponent.dataCache.set(cacheKey, { data, expires: Date.now() + CustomLandingPageComponent.CACHE_TTL }))
        );

    combineLatest([
      mainData$,
      this.settingsService.getPublicDeliveryMethods()
    ]).subscribe({
      next: ([res, methods]) => {
        this.data = res;
        this.selectedImage = res.product?.imageUrl || "";
        this.deliveryMethods = methods;

        if (res.product) {
          this.updateSelections(res.product, 0, "");
        }

        if (res.config?.sectionsJson) {
          try {
            this.sections = JSON.parse(res.config.sectionsJson);
            this.sections.forEach(s => this.ensureSectionSettings(s));
            this.configForm.patchValue({ sectionsJson: res.config.sectionsJson });
          } catch (e) {
            console.error("Invalid sections JSON", e);
          }
        }

        if (this.isEditMode) {
          this.loadAllProducts();
        }

        if (res.product?.variants?.length > 0) {
          this.orderForm.patchValue({ selectedSize: "" });
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

        // Show page immediately with essential data
        this.isLoading = false;

        // Start auto-slide right away (only needs product.images, already loaded)
        this.startAutoSlide();

        // Fire all non-critical API calls in parallel
        const selectSection = this.sections.find(s => s.type === "product-select");
        const customIds = selectSection?.settings?.customProductIds as number[] | undefined;
        const nameParts = (res.product?.name || "").trim().split(" ");
        const nameCode = (nameParts.length > 0 && nameParts[0].length >= 3) ? nameParts[0] : undefined;

        forkJoin({
          reviews: res.product?.id ? this.reviewService.getReviewsByProductId(res.product.id) : of([]),
          customProducts: customIds?.length ? this.productService.getProducts({ ids: customIds.join(","), pageSize: 100 }) : of({ data: [] as Product[] }),
          related: res.product ? this.productService.getRelatedProducts(
            undefined,
            nameCode ? undefined : res.product.categoryId,
            nameCode ? undefined : res.product.productGroupId,
            12,
            nameCode
          ) : of({ data: [] as Product[] })
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (result) => {
            this.productReviews = result.reviews;
            this.defaultRelatedProducts = result.related.data.filter(p => p.id !== res.product?.id);
            this.relatedProducts = result.customProducts.data.length > 0
              ? result.customProducts.data.filter(p => p.id !== res.product?.id)
              : [];
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error("Failed to load landing page data", err);
        this.notification.error(err.error?.message || "Resource not found. The product might be inactive or deleted.");
      }
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
    // For single-product legacy getters (used in some old banners)
    const product = this.data?.product;
    if (!product) return 0;
    const selection = this.productSelections[product.id];
    const variant = product.variants?.find(v => v.size === selection?.selectedSize);
    return variant?.price || this.data?.config?.promoPrice || product.price || 0;
  }

  getProductPrice(product: Product): number {
    const selection = this.productSelections[product.id];
    const variant = product.variants?.find(v => v.size === selection?.selectedSize);
    return variant?.price || (product.id === this.data?.product.id ? this.data?.config?.promoPrice : 0) || product.price || 0;
  }

  get total(): number {
    let subtotal = 0;
    for (const selection of this.selectedProductList) {
      subtotal += this.getProductPrice(selection.product) * selection.quantity;
    }
    return subtotal + this.shippingCost;
  }

  // Helper for old components that might still use uniqueSizes
  getUniqueSizes(product: Product): string[] {
    if (!product.variants) return [];
    const sizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))) as string[];
    return sortProductSizes(sizes);
  }

  onSubmit(): void {
    const selections = this.selectedProductList;
    
    // Check if any selected product is missing a size
    const itemsMissingSize = selections.filter(s => (s.product.variants?.length ?? 0) > 0 && !s.selectedSize);
    if (itemsMissingSize.length > 0) {
      this.notification.warn(`"${itemsMissingSize[0].product.name}" - আগে সাইজ সিলেক্ট করুন`);
      const el = document.getElementById("product-select-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (this.orderForm.invalid || !this.data || selections.length === 0) {
      this.orderForm.markAllAsTouched();
      if (selections.length === 0) {
        this.notification.error("Please select at least one product.");
        this.scrollToOrder();
      } else {
        this.notification.error("Please fill in all required fields.");
      }
      return;
    }
    this.isOrdering = true;
    const form = this.orderForm.getRawValue();
    const method = this.selectedDeliveryMethod;

    const cartItems: CartItem[] = selections.map(s => {
      const price = this.getProductPrice(s.product);
      return {
        id: "clp-" + s.product.id + "-" + Date.now(),
        productId: s.product.id,
        name: s.product.name,
        price: price,
        quantity: s.quantity,
        size: s.selectedSize,
        imageUrl: s.product.imageUrl || "",
        imageAlt: s.product.name,
        discountPercentage: 0,
        compareAtPrice: s.product.id === this.data?.product.id ? this.data?.config?.originalPrice : s.product.compareAtPrice
      };
    });

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = this.shippingCost;
    const summary: CartSummary = {
      itemsCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      tax: 0,
      shipping,
      discount: cartItems.reduce((sum, item) => sum + (item.compareAtPrice ? (item.compareAtPrice - item.price) * item.quantity : 0), 0),
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
        city: form.city, 
        area: form.area, 
        deliveryMethodId: form.deliveryMethodId 
      },
      cartItems: cartItems,
      summary,
      deliveryMethodId: form.deliveryMethodId
    }).subscribe({
      next: (order: Order) => {
        this.isOrdering = false;
        if (order?.id) {
          this.userPersistence.saveUserDetails({ fullName: form.fullName, phone: form.phone, address: form.address, city: form.city, area: form.area });
          void this.router.navigate(["/order-confirmation", order.id]);
        }
      },
      error: () => this.isOrdering = false
    });
  }

  // Re-implement shipping helpers for multi-product
  get selectedDeliveryMethod(): DeliveryMethod | null {
    const id = this.orderForm.get("deliveryMethodId")?.value;
    return this.deliveryMethods.find(m => m.id === id) || null;
  }

  get shippingCost(): number {
    const totalQty = this.selectedProductList.reduce((sum, s) => sum + s.quantity, 0);
    const threshold = this.data?.config?.freeShippingThresholdQuantity;
    if (threshold && totalQty >= threshold) return 0;
    return this.selectedDeliveryMethod?.cost ?? 0;
  }

  selectSize(size: string): void { this.orderForm.patchValue({ selectedSize: size }); }
  updateQuantity(delta: number): void {
    const current = this.orderForm.get("quantity")?.value || 1;
    this.orderForm.patchValue({ quantity: Math.max(1, current + delta) });
  }
  selectDeliveryMethod(id: number): void {
    this.userSelectedDeliveryMethod = true;
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

  private updateDeliveryMethod(city: string, area: string): void {
    const outskirts = ["keraniganj", "savar", "ashulia", "asulia", "dohar"];
    const isOutskirts = area && outskirts.includes(area.toLowerCase());
    const isDhaka = city.toLowerCase() === "dhaka" && !isOutskirts;
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
    const selections = this.selectedProductList;
    if (selections.length === 0) {
      this.notification.error("Please select a product first.");
      return;
    }

    this.siteSettingsService.getSettings().subscribe(settings => {
      const phone = (settings.whatsAppNumber || settings.contactPhone || "").replace(/\D/g, "");
      const productNames = selections.map(s => `${s.product.name} (Size: ${s.selectedSize}, Qty: ${s.quantity})`).join(", ");
      const message = encodeURIComponent(`Hello, I'm interested in: ${productNames}. Can you help me?`);
      if (phone) window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    });
  }

  formatSizes(variants: ProductVariant[] | undefined): string {
    if (!variants) return "";
    return Array.from(new Set(variants.map(v => v.size).filter(Boolean))).join(", ");
  }

  openQuickAdd(product: Product, event: Event): void {
    event.preventDefault(); event.stopPropagation();
    this.selectedQuickProduct = product; this.showQuickAdd = true;
  }

  onQuickAddConfirm(selection: { size?: string; quantity: number }): void {
    if (this.selectedQuickProduct) {
      const queryParams: Record<string, string> = {};
      if (selection.size) queryParams["qSize"] = selection.size;
      if (selection.quantity > 1) queryParams["qQty"] = String(selection.quantity);
      this.showQuickAdd = false;
      void this.router.navigate(['/clp', this.selectedQuickProduct.slug], { queryParams, queryParamsHandling: 'merge' }).then(() => this.scrollToOrder());
    } else this.showQuickAdd = false;
  }

  // --- MODULAR SECTION MANAGEMENT ---
  ensureSectionSettings(section: LandingSection): void {
    if (!section.settings) section.settings = {};
    const s = section.settings;
    const form = this.configForm.value;
    
    if (section.type === 'countdown') {
      if (s.isTimerVisible === undefined) s.isTimerVisible = form.isTimerVisible !== undefined ? form.isTimerVisible : true;
      if (s.headerTitle === undefined) s.headerTitle = form.headerTitle || 'অফারটি শেষ হতে মাত্র কিছুক্ষণ বাকি আছে!';
      if (s.relativeTimerTotalMinutes === undefined) s.relativeTimerTotalMinutes = form.relativeTimerTotalMinutes !== undefined ? form.relativeTimerTotalMinutes : null;
    } else if (section.type === 'hero') {
      if (s.heroTitle === undefined) s.heroTitle = form.heroTitle || 'একচেটিয়া অফার! আজকের জন্যই সেরা সুযোগ';
      if (s.heroSubtitle === undefined) s.heroSubtitle = form.heroSubtitle || 'প্রিমিয়াম কোয়ালিটি এখন সাশ্রয়ী মূল্যে';
      if (s.heroBadge === undefined) s.heroBadge = form.heroBadge || 'স্টক ফুরিয়ে যাওয়ার আগেই সংগ্রহ করুন';
    } else if (section.type === 'product-hero') {
      if (s.productHeroTitle === undefined) s.productHeroTitle = form.productHeroTitle || 'আমাদের প্রিমিয়াম প্রসাধনী';
      if (s.productHeroDescription === undefined) s.productHeroDescription = form.productHeroDescription || 'সেরা উপাদান দিয়ে তৈরি যা আপনার ত্বকের যত্ন নেবে।';
    } else if (section.type === 'discount-cta') {
      if (s.discountCtaTitle === undefined) s.discountCtaTitle = form.discountCtaTitle || 'অবিশ্বাস্য ডিসকাউন্ট অফার!';
      if (s.discountCtaDescription === undefined) s.discountCtaDescription = form.discountCtaDescription || 'আজই অর্ডার করলে পাবেন বিশেষ ছাড় এবং ফ্রি ডেলিভারি।';
    } else if (section.type === 'info-banner') {
      if (s.infoBannerTitle === undefined) s.infoBannerTitle = form.infoBannerTitle || 'প্রোডাক্ট ব্যবহারের নিয়মাবলী';
      if (s.infoBannerDescription === undefined) s.infoBannerDescription = form.infoBannerDescription || 'প্রতিদিন সকালে ও রাতে পরিষ্কার ত্বকে অল্প পরিমাণে ক্রিম লাগিয়ে আলতোভাবে ম্যাসাজ করুন।';
    } else if (section.type === 'product-details') {
      if (s.isProductDetailsVisible === undefined) s.isProductDetailsVisible = form.isProductDetailsVisible !== undefined ? form.isProductDetailsVisible : true;
      if (s.productDetailsTitle === undefined) s.productDetailsTitle = form.productDetailsTitle || '🔥 প্রোডাক্ট ডিটেইলস';
      if (s.isFabricVisible === undefined) s.isFabricVisible = form.isFabricVisible !== undefined ? form.isFabricVisible : true;
      if (s.isDesignVisible === undefined) s.isDesignVisible = form.isDesignVisible !== undefined ? form.isDesignVisible : true;
    } else if (section.type === 'trust-banner') {
      if (s.isTrustBannerVisible === undefined) s.isTrustBannerVisible = form.isTrustBannerVisible !== undefined ? form.isTrustBannerVisible : true;
      if (s.trustBannerText === undefined) s.trustBannerText = form.trustBannerText || 'দেখে চেক করে রিসিভ করতে পারবেন। পছন্দ না হলে ডেলিভারি চার্জ দিয়ে রিটার্ন করে দিতে পারবেন সহজেই';
    } else if (section.type === 'reviews') {
      if (s.isReviewsVisible === undefined) s.isReviewsVisible = form.isReviewsVisible !== undefined ? form.isReviewsVisible : true;
    } else if (section.type === 'order-form') {
      if (s.promoText === undefined) s.promoText = form.promoText || 'যেকোনো কালার যেকোনো সাইজ দুই পিস অর্ডার করলেই পাচ্ছেন মাত্র ১৪৫০ টাকা';
    }
  }

  toggleActiveSection(section: LandingSection): void {
    this.ensureSectionSettings(section);
    this.activeEditorSection = this.activeEditorSection === section.id ? '' : section.id;
  }

  moveSection(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.sections[index], this.sections[index-1]] = [this.sections[index-1], this.sections[index]];
    } else if (direction === 'down' && index < this.sections.length - 1) {
      [this.sections[index], this.sections[index+1]] = [this.sections[index+1], this.sections[index]];
    }
    this.sections = [...this.sections];
    this.updateSections();
  }

  drop(event: CdkDragDrop<LandingSection[]>): void {
    moveItemInArray(this.sections, event.previousIndex, event.currentIndex);
    this.sections = [...this.sections];
    this.updateSections();
  }

  toggleVisibility(index: number): void { 
    this.sections[index].visible = !this.sections[index].visible; 
    this.sections = [...this.sections];
    this.updateSections();
  }

  deleteSection(index: number): void { 
    if (confirm('Delete this section?')) {
      const deletedSection = this.sections[index];
      if (deletedSection && this.activeEditorSection === deletedSection.id) {
        this.activeEditorSection = '';
      }
      this.sections.splice(index, 1); 
      this.sections = [...this.sections];
      this.updateSections();
    }
  }
  
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
    const settings: any = {};
    if (type === 'product-select') settings.customProductIds = [];
    const section = { id: `${type}_${Date.now()}`, type, label: labels[type] || 'New Section', visible: true, settings };
    this.ensureSectionSettings(section);
    this.sections.push(section);
    this.sections = [...this.sections];
    this.updateSections();
  }

  // --- PRODUCT SELECTION MANAGEMENT ---
  get productsForSelectionPool(): Product[] {
    const pool = [...this.defaultRelatedProducts];
    
    // Add search results if searching
    if (this.productSearchTerm) {
      this.allProducts.forEach(p => {
        if (!pool.find(item => item.id === p.id)) {
          if (p.name.toLowerCase().includes(this.productSearchTerm.toLowerCase()) || 
              p.sku.toLowerCase().includes(this.productSearchTerm.toLowerCase())) {
            pool.push(p);
          }
        }
      });
    }
    
    return pool;
  }

  toggleProductSelection(productId: number): void {
    const section = this.sections.find(s => s.type === "product-select");
    if (!section) return;
    
    if (!section.settings) section.settings = {};
    if (!section.settings.customProductIds) section.settings.customProductIds = [];
    
    const index = section.settings.customProductIds.indexOf(productId);
    if (index > -1) {
      section.settings.customProductIds.splice(index, 1);
    } else {
      section.settings.customProductIds.push(productId);
    }
    
    this.refreshRelatedProducts();
    this.updateSections();
  }

  updateSections(): void {
    const json = JSON.stringify(this.sections);
    this.configForm.patchValue({ sectionsJson: json });
  }

  private loadAllProducts(): void {
    this.isProductSelectionLoading = true;
    this.productService.getProducts({ pageSize: 100, orderBy: "name" }).subscribe({
      next: (res) => {
        this.allProducts = res.data;
        this.isProductSelectionLoading = false;
        this.refreshRelatedProducts();
      },
      error: () => (this.isProductSelectionLoading = false)
    });
  }

  isProductInCustomSelection(productId: number): boolean {
    const section = this.sections.find(s => s.type === "product-select");
    return section?.settings?.customProductIds?.includes(productId) || false;
  }

  private refreshRelatedProducts(): void {
    const section = this.sections.find(s => s.type === "product-select");
    const customIds = section?.settings?.customProductIds as number[] | undefined;
    
    if (customIds && customIds.length > 0) {
      // Prioritize from allProducts if in edit mode and loaded, else from pool
      const combined = [...this.allProducts, ...this.defaultRelatedProducts];
      const selected = combined.filter(p => customIds.includes(p.id) && p.id !== this.data?.product.id);
      
      // If we don't have all selected products in the local pool, we'll need to fetch them
      if (selected.length < customIds.length && !this.isProductSelectionLoading) {
        this.productService.getProducts({ ids: customIds.join(","), pageSize: 100 }).subscribe(res => {
          this.relatedProducts = res.data.filter(p => p.id !== this.data?.product.id);
        });
      } else {
        this.relatedProducts = selected;
      }
    } else {
      // Strictly manual curation - if nothing selected, show nothing
      this.relatedProducts = [];
    }
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

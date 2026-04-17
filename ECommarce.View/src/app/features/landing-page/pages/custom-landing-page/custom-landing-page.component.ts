import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { LucideAngularModule, ShoppingCart, Truck, Verified, RotateCcw, Clock, Search, Loader2 } from "lucide-angular";
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
import { map, catchError } from "rxjs";
import { ProductService } from "../../../../core/services/product.service";
import { of } from "rxjs";

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
  readonly icons = { ShoppingCart, Truck, Verified, RotateCcw, Clock, Search, Loader2 };
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

  brandName$ = this.siteSettingsService.getSettings().pipe(map(s => s.websiteName));

  data: LandingPageData | null = null;
  relatedProducts: Product[] = [];
  deliveryMethods: DeliveryMethod[] = [];
  isLoading = true;
  isOrdering = false;
  timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  private timerInterval: any;

  readonly orderForm = this.fb.nonNullable.group({
    fullName: ["", [Validators.required]],
    phone: ["", [Validators.required]],
    address: ["", [Validators.required]],
    deliveryMethodId: [0, [Validators.required, Validators.min(1)]],
    selectedSize: ["", [Validators.required]]
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get("slug");
    if (slug) {
      this.loadData(slug);
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadData(slug: string): void {
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

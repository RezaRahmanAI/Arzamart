import { Component, DestroyRef, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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
} from "rxjs";
import {
  LucideAngularModule,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Truck,
  Lock,
  ArrowRight,
  Plus,
  Minus,
  ShoppingCart,
  User,
  Search,
  ChevronDown,
  ChevronUp,
  Star,
  Maximize2,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  X,
} from "lucide-angular";
import { BANGLADESH_LOCATIONS } from "../../../../core/utils/bangladesh-locations";

import { AdultProductService } from "../../services/adult-product.service";
import { AdultProduct } from "../../../../admin/models/adult-product.models";
import { CartService } from "../../../../core/services/cart.service";
import { OrderService } from "../../../../core/services/order.service";
import { CartItem, CartSummary } from "../../../../core/models/cart";
import { CheckoutService } from "../../../../core/services/checkout.service";
import { CustomerOrderApiService } from "../../../../core/services/customer-order-api.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { SettingsService } from "../../../../admin/services/settings.service";
import { DeliveryMethod } from "../../../../admin/models/settings.models";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";

@Component({
  selector: "app-adult-landing-page",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./adult-landing-page.component.html",
  styleUrl: "./adult-landing-page.component.css",
})
export class AdultLandingPageComponent implements OnInit {
  // ... (rest of the code remains the same as previously written in Step 54)
  readonly icons = {
    Loader2,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Truck,
    Lock,
    ArrowRight,
    Plus,
    Minus,
    ShoppingCart,
    User,
    Search,
    ChevronDown,
    ChevronUp,
    Star,
    Maximize2,
    ShieldCheck,
    ShoppingBag,
    CreditCard,
    MessageSquare,
    X,
  };
  private readonly route = inject(ActivatedRoute);
  private readonly adultProductService = inject(AdultProductService);
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly customerOrderApi = inject(CustomerOrderApiService);
  private readonly settingsService = inject(SettingsService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly orderService = inject(OrderService);

  product: AdultProduct | null = null;
  landingPage: any = null;
  siteSettings: any = null;
  isLoading = false;
  isOrdering = false;
  errorMessage = "";
  date = new Date();
  
  deliveryMethods: DeliveryMethod[] = [];
  selectedMethod: DeliveryMethod | null = null;

  // Review Slider State
  reviews: any[] = [
    {
      customerName: "Rahim Ahmed",
      comment: "অসাধারণ প্রোডাক্ট! আমি অনেকদিন ধরে এমন কিছু খুঁজছিলাম। প্যাকেজিং খুবই ডিসক্রিট ছিল।",
      reviewImage: null
    },
    {
      customerName: "Karim Uddin",
      comment: "খুবই দ্রুত ডেলিভারি পেয়েছি। প্রোডাক্টের মান অনেক ভালো। ধন্যবাদ অর্জামার্টকে।",
      reviewImage: null
    },
    {
      customerName: "Siddique Ullah",
      comment: "প্রথমে একটু দ্বিধায় ছিলাম, কিন্তু ব্যবহারের পর বুঝলাম এটা আসলেও কার্যকরী।",
      reviewImage: null
    }
  ];
  currentReviewIndex = 0;

  // Offer Items (Product Selection Grid)
  offerItems: any[] = [];
  
  // Modal State
  isModalOpen = false;
  selectedPopupItem: any = null;
  modalQuantity = 1;

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    phone: ["", [Validators.required, Validators.minLength(11)]],
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    district: ["", Validators.required],
    area: ["", Validators.required],
    address: ["", [Validators.required, Validators.minLength(5)]],
    deliveryMethodId: [0, Validators.required],
  });

  districts = Object.keys(BANGLADESH_LOCATIONS).sort();
  availableAreas: string[] = [];

  ngOnInit(): void {
    this.loadProductAndSettings();
    this.setupFormWatchers();
  }

  private loadProductAndSettings(): void {
    this.isLoading = true;

    combineLatest([
      this.route.paramMap.pipe(
        map((params) => params.get("slug") ?? ""),
        filter((slug) => slug.length > 0),
        switchMap((slug) => this.adultProductService.getBySlug(slug)),
      ),
      this.settingsService.getPublicDeliveryMethods(),
      this.settingsService.settings$,
      this.adultProductService.getAll()
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([product, methods, settings, allProducts]: [AdultProduct | null, DeliveryMethod[], any, AdultProduct[]]) => {
          this.product = product;
          this.landingPage = product;
          this.siteSettings = settings;
          this.deliveryMethods = methods;
          this.offerItems = allProducts.map(p => ({
            ...p,
            name: p.headline,
            imageUrl: this.imageUrlService.getImageUrl(p.imgUrl),
            quantity: p.id === product?.id ? 1 : 0
          }));
          this.isLoading = false;

          if (methods.length > 0) {
            const defaultMethod =
              methods.find((m) => m.name.toLowerCase().includes("inside")) ||
              methods[0];
            this.checkoutForm.patchValue({
              deliveryMethodId: defaultMethod.id,
            });
            this.selectedMethod = defaultMethod;
          }

          if (!settings) {
            this.settingsService.getSettings().subscribe();
          }
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = "Product not found.";
        },
      });
  }

  private setupFormWatchers(): void {
    this.checkoutForm.controls.phone.valueChanges
      .pipe(
        map((value) => value.trim()),
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
          this.checkoutForm.patchValue(
            {
              fullName: customer.name,
              address: customer.address,
              district: customer.city || "Dhaka"
            },
            { emitEvent: true },
          );
        }
      });

    this.checkoutForm.controls.deliveryMethodId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.selectedMethod =
          this.deliveryMethods.find((m) => m.id === id) || null;
      });

    this.checkoutForm.controls.district.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((city) => {
        this.availableAreas = BANGLADESH_LOCATIONS[city] || [];
        this.checkoutForm.patchValue({ area: "" });
        this.updateDeliveryMethodByCity(city);
      });
  }

  private updateDeliveryMethodByCity(city: string): void {
    const isDhaka = city.toLowerCase() === "dhaka";
    const method = this.deliveryMethods.find((m) =>
      isDhaka
        ? m.name.toLowerCase().includes("inside")
        : m.name.toLowerCase().includes("outside"),
    );
    if (method) {
      this.checkoutForm.patchValue({ deliveryMethodId: method.id });
      this.selectedMethod = method;
    }
  }

  scrollToOrderForm(): void {
    const el = document.getElementById("order");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  prevReview(): void {
    this.currentReviewIndex = (this.currentReviewIndex - 1 + this.reviews.length) % this.reviews.length;
  }

  nextReview(): void {
    this.currentReviewIndex = (this.currentReviewIndex + 1) % this.reviews.length;
  }

  goToReview(index: number): void {
    this.currentReviewIndex = index;
  }

  changeQty(item: any, delta: number): void {
    const newQty = (item.quantity || 0) + delta;
    item.quantity = Math.max(0, newQty);
  }

  updateQuantity(item: any, event: any): void {
    const val = parseInt(event.target.value, 10);
    item.quantity = isNaN(val) ? 0 : Math.max(0, val);
  }

  openProductModal(item: any): void {
    this.selectedPopupItem = item;
    this.modalQuantity = item.quantity > 0 ? item.quantity : 1;
    this.isModalOpen = true;
  }

  closeProductModal(): void {
    this.isModalOpen = false;
    this.selectedPopupItem = null;
  }

  updateModalQuantity(delta: number): void {
    this.modalQuantity = Math.max(1, this.modalQuantity + delta);
  }

  confirmModalAdd(): void {
    if (this.selectedPopupItem) {
      this.selectedPopupItem.quantity = this.modalQuantity;
      this.closeProductModal();
    }
  }

  get subtotal(): number {
    return this.offerItems.reduce((acc, item) => acc + (item.price * (item.quantity || 0)), 0);
  }

  get total(): number {
    const sub = this.subtotal;
    if (sub === 0) return 0;
    const shipping = this.selectedMethod?.cost ?? 0;
    return sub + shipping;
  }

  hasDiscount(product: { price: number; compareAtPrice?: number }): boolean {
    return !!(
      product.compareAtPrice &&
      product.compareAtPrice > 0 &&
      product.compareAtPrice > product.price
    );
  }

  getDiscountPercentage(product: {
    price: number;
    compareAtPrice?: number;
  }): number {
    if (!this.hasDiscount(product)) return 0;
    const discount = (product.compareAtPrice ?? 0) - product.price;
    return Math.round((discount / (product.compareAtPrice ?? 1)) * 100);
  }

  placeOrder(): void {
    if (this.isOrdering || this.subtotal === 0) return;
    this.errorMessage = "";

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isOrdering = true;
    const form = this.checkoutForm.getRawValue();

    const selectedItems = this.offerItems.filter(i => i.quantity > 0);
    const cartItems: any[] = selectedItems.map(item => ({
      id: "adult-" + item.id + "-" + Date.now(),
      productId: item.id,
      name: item.headline,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imgUrl,
      imageAlt: item.headline,
      discountPercentage: this.getDiscountPercentage(item),
      compareAtPrice: item.compareAtPrice,
      isAdult: true,
      color: "N/A",
      size: "N/A"
    }));

    const subtotal = this.subtotal;
    const shipping = this.selectedMethod?.cost ?? 0;
    
    const summary: CartSummary = {
      itemsCount: selectedItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: subtotal,
      tax: 0,
      shipping: shipping,
      discount: selectedItems.reduce((acc, i) => acc + ((i.compareAtPrice ? (i.compareAtPrice - i.price) : 0) * i.quantity), 0),
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
        city: form.district,
        area: form.area,
        deliveryMethodId: form.deliveryMethodId
      },
      cartItems,
      summary,
      deliveryMethodId: form.deliveryMethodId
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (order) => {
        this.isOrdering = false;
        if (order?.id) {
          void this.router.navigate(["/order-confirmation", order.id]);
        }
      },
      error: (error: Error) => {
        this.isOrdering = false;
        this.errorMessage = error.message ?? "Unable to place order.";
      },
    });
  }
}

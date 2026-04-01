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
  MessageCircle,
} from "lucide-angular";
import { BANGLADESH_LOCATIONS } from "../../../../core/utils/bangladesh-locations";

import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { CartService } from "../../../../core/services/cart.service";
import { OrderService } from "../../../../core/services/order.service";
import { CartItem, CartSummary } from "../../../../core/models/cart";
import { CheckoutService } from "../../../../core/services/checkout.service";
import { CustomerOrderApiService } from "../../../../core/services/customer-order-api.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { SettingsService } from "../../../../admin/services/settings.service";
import { DeliveryMethod } from "../../../../admin/models/settings.models";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { SizeGuideComponent } from "../../../../shared/components/size-guide/size-guide.component";

@Component({
  selector: "app-landing-page",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
    SizeGuideComponent,
  ],
  templateUrl: "./landing-page.component.html",
  styleUrl: "./landing-page.component.css",
})
export class LandingPageComponent implements OnInit {
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
    MessageCircle,
  };
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly customerOrderApi = inject(CustomerOrderApiService);
  private readonly settingsService = inject(SettingsService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly orderService = inject(OrderService);

  product: Product | null = null;
  isLoading = false;
  isOrdering = false;
  errorMessage = "";
  didAutofill = false;
  isSizeGuideOpen = false;
  deliveryMethods: DeliveryMethod[] = [];
  selectedMethod: DeliveryMethod | null = null;

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    city: ["Dhaka", Validators.required],
    area: ["", Validators.required],
    deliveryMethodId: [0, Validators.required],
    selectedColor: [""],
    selectedSize: [""],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  cities = Object.keys(BANGLADESH_LOCATIONS).sort();
  filteredCities: string[] = [];
  citySearch = "";
  isCityDropdownOpen = false;

  areas: string[] = [];
  filteredAreas: string[] = [];
  areaSearch = "";
  isAreaDropdownOpen = false;

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
        switchMap((slug) => this.productService.getBySlug(slug)),
      ),
      this.settingsService.getPublicDeliveryMethods(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([product, methods]) => {
          this.product = product;
          this.deliveryMethods = methods;
          this.isLoading = false;

          if (product) {
            // Set defaults
            const colors = Array.from(
              new Set(product.images?.map((i) => i.color).filter(Boolean)),
            );
            const sizes = Array.from(
              new Set(product.variants?.map((v) => v.size).filter(Boolean)),
            );

            this.checkoutForm.patchValue({
              selectedColor: colors[0] ?? "",
              selectedSize:
                product.variants?.find((v) => v.isDefault)?.size ??
                sizes[0] ??
                "",
            });
          }

          if (methods.length > 0) {
            const defaultMethod =
              methods.find((m) => m.name.toLowerCase().includes("inside")) ||
              methods[0];
            this.checkoutForm.patchValue({
              deliveryMethodId: defaultMethod.id,
            });
            this.selectedMethod = defaultMethod;
            
            // Initial city/area setup
            const initialCity = this.checkoutForm.controls.city.value;
            this.areas = BANGLADESH_LOCATIONS[initialCity] || [];
            this.filteredAreas = [...this.areas];
            this.updateDeliveryMethodByCity(initialCity);
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
          this.didAutofill = true;
          this.checkoutForm.patchValue(
            {
              fullName: customer.name,
              address: customer.address,
            },
            { emitEvent: false },
          );
        }
      });

    this.checkoutForm.controls.deliveryMethodId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.selectedMethod =
          this.deliveryMethods.find((m) => m.id === id) || null;
      });

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

  filterCities(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.citySearch = query;
    this.filteredCities = this.cities.filter((c) =>
      c.toLowerCase().includes(query),
    );
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
      this.citySearch = this.checkoutForm.controls.city.value || "";
    }
  }

  filterAreas(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.areaSearch = query;
    this.filteredAreas = this.areas.filter((a) =>
      a.toLowerCase().includes(query),
    );
  }

  selectArea(area: string): void {
    this.checkoutForm.patchValue({ area });
    this.areaSearch = area;
    this.isAreaDropdownOpen = false;
  }

  toggleAreaDropdown(): void {
    if (!this.checkoutForm.controls.city.value) return;
    this.isAreaDropdownOpen = !this.isAreaDropdownOpen;
    if (this.isAreaDropdownOpen) {
      this.isCityDropdownOpen = false;
      this.filteredAreas = [...this.areas];
      this.areaSearch = this.checkoutForm.controls.area.value || "";
    }
  }

  openSizeGuide(): void {
    this.isSizeGuideOpen = true;
  }

  closeSizeGuide(): void {
    this.isSizeGuideOpen = false;
  }

  selectedColorName(colorName: string | null): string {
    return colorName || "None selected";
  }

  selectedSizeLabel(size: string | null): string {
    return size || "Select size";
  }

  get currentPrice(): number {
    if (!this.product) return 0;
    const selectedSize = this.checkoutForm.controls.selectedSize.value;
    const variant = this.product.variants?.find((v) => v.size === selectedSize);

    if (variant?.price && variant.price > 0) {
      return variant.price;
    }
    return this.product.price;
  }

  get currentCompareAtPrice(): number | undefined {
    if (!this.product) return undefined;
    const selectedSize = this.checkoutForm.controls.selectedSize.value;
    const variant = this.product.variants?.find((v) => v.size === selectedSize);

    if (variant?.compareAtPrice && variant.compareAtPrice > 0) {
      return variant.compareAtPrice;
    }
    return this.product?.compareAtPrice;
  }

  get total(): number {
    if (!this.product) return 0;
    const subtotal =
      this.currentPrice * this.checkoutForm.controls.quantity.value;
    const shipping = this.selectedMethod?.cost ?? 0;
    return subtotal + shipping;
  }

  // UI Helpers matching ProductDetailsPageComponent
  currentImageIndex = 0;

  get gallery(): string[] {
    if (!this.product) return [];
    const images = this.product.images?.map((i) => i.imageUrl) ?? [];
    let gallery = [];
    if (this.product.imageUrl) {
      gallery.push(this.product.imageUrl);
    }
    images.forEach((img) => {
      if (img !== this.product?.imageUrl) {
        gallery.push(img);
      }
    });
    return gallery;
  }

  get uniqueColors(): { name: string; hex: string }[] {
    if (!this.product) return [];
    return Array.from(
      new Set(this.product.images?.map((i) => i.color).filter(Boolean)),
    ).map((color) => ({ name: color!, hex: "" }));
  }

  prevImage(): void {
    const len = this.gallery.length;
    if (len === 0) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + len) % len;
  }

  nextImage(): void {
    const len = this.gallery.length;
    if (len === 0) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % len;
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
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

  getColorImage(color: string): string | null {
    if (!this.product?.images) return null;
    const img = this.product.images.find((i) => i.color === color);
    return img ? this.imageUrlService.getImageUrl(img.imageUrl) : null;
  }

  selectColor(colorName: string): void {
    this.checkoutForm.patchValue({ selectedColor: colorName });

    // Switch image
    const colorImage = this.product?.images.find((i) => i.color === colorName);
    if (colorImage) {
      const index = this.gallery.findIndex(
        (url) => url === colorImage.imageUrl,
      );
      if (index !== -1) this.currentImageIndex = index;
    }
  }

  increaseQuantity(): void {
    const current = this.checkoutForm.controls.quantity.value;
    this.checkoutForm.patchValue({ quantity: current + 1 });
  }

  decreaseQuantity(): void {
    const current = this.checkoutForm.controls.quantity.value;
    if (current > 1) {
      this.checkoutForm.patchValue({ quantity: current - 1 });
    }
  }

  private calculateShipping(subtotal: number, city: string): number {
    const isInsideDhaka = city.toLowerCase().includes("dhaka");
    return isInsideDhaka ? 60 : 120; // Default values consistent with user's earlier message
  }

  placeOrder(): void {
    if (this.isOrdering || !this.product) return;
    this.errorMessage = "";

    // Manual validation check for required variants
    const colors = Array.from(
      new Set(this.product.images?.map((i) => i.color).filter(Boolean)),
    );
    const sizes = Array.from(
      new Set(this.product.variants?.map((v) => v.size).filter(Boolean)),
    );

    const isColorRequired = colors.length > 0;
    const isSizeRequired = sizes.length > 0;

    const formRaw = this.checkoutForm.getRawValue();

    if (
      this.checkoutForm.invalid ||
      (isColorRequired && !formRaw.selectedColor) ||
      (isSizeRequired && !formRaw.selectedSize)
    ) {
      if (isColorRequired && !formRaw.selectedColor) {
        this.errorMessage = "Please select a color.";
      } else if (isSizeRequired && !formRaw.selectedSize) {
        this.errorMessage = "Please select a size.";
      }
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isOrdering = true;
    this.errorMessage = "";

    const form = this.checkoutForm.getRawValue();

    // 1. Construct local order payload to bypass global cart
    const cartItem: CartItem = {
      id: "landing-" + Date.now(),
      productId: this.product.id,
      name: this.product.name,
      price: this.currentPrice,
      quantity: form.quantity,
      color: form.selectedColor,
      size: form.selectedSize,
      imageUrl: this.product.images?.find(i => i.color === form.selectedColor)?.imageUrl || this.product.imageUrl || "",
      imageAlt: this.product.name,
      discountPercentage: this.getDiscountPercentage({ price: this.currentPrice, compareAtPrice: this.currentCompareAtPrice }),
      compareAtPrice: this.currentCompareAtPrice
    };

    const cartItems = [cartItem];
    const subtotal = this.currentPrice * form.quantity;
    const shipping = this.calculateShipping(subtotal, form.city);
    const summary: CartSummary = {
      itemsCount: form.quantity,
      subtotal: subtotal,
      tax: 0,
      shipping: shipping,
      discount: (this.currentCompareAtPrice ? (this.currentCompareAtPrice - this.currentPrice) : 0) * form.quantity,
      total: subtotal + shipping,
      freeShippingThreshold: 0,
      freeShippingRemaining: 0,
      freeShippingProgress: 100
    };

    // 2. Place order directly via OrderService
    this.orderService.placeOrder({
      state: {
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        area: form.area,
        deliveryMethodId: form.deliveryMethodId
      },
      cartItems,
      summary,
      deliveryMethodId: form.deliveryMethodId
    })
    .pipe(
      takeUntilDestroyed(this.destroyRef)
    )
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

  addToCart(): void {
    if (this.isOrdering || !this.product) return;
    this.errorMessage = "";

    const colors = Array.from(
      new Set(this.product.images?.map((i) => i.color).filter(Boolean)),
    );
    const sizes = Array.from(
      new Set(this.product.variants?.map((v) => v.size).filter(Boolean)),
    );

    const isColorRequired = colors.length > 0;
    const isSizeRequired = sizes.length > 0;

    const formRaw = this.checkoutForm.getRawValue();

    if (
      (isColorRequired && !formRaw.selectedColor) ||
      (isSizeRequired && !formRaw.selectedSize)
    ) {
      if (isColorRequired && !formRaw.selectedColor) {
        this.errorMessage = "Please select a color.";
      } else if (isSizeRequired && !formRaw.selectedSize) {
        this.errorMessage = "Please select a size.";
      }
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const form = this.checkoutForm.getRawValue();
    this.cartService
      .addItem(
        this.product,
        form.quantity,
        form.selectedColor,
        form.selectedSize,
      )
      .subscribe();
  }
}

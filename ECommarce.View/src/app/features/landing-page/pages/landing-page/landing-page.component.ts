import { Component, DestroyRef, OnInit, inject } from "@angular/core";
import { AsyncPipe, NgClass } from "@angular/common";
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
} from "rxjs";
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
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-landing-page",
  standalone: true,
  imports: [
    AsyncPipe,
    NgClass,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
    SizeGuideComponent,
    AppIconComponent,
  ],
  templateUrl: "./landing-page.component.html",
  styleUrl: "./landing-page.component.css",
})
export class LandingPageComponent implements OnInit {
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
    city: ["Dhaka"],
    area: [""],
    deliveryMethodId: [0, Validators.required],
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
            const sizes = Array.from(
              new Set(product.variants?.map((v) => v.size).filter(Boolean)),
            );

            this.checkoutForm.patchValue({
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

  getDiscountAmount(product: {
    price: number;
    compareAtPrice?: number;
  }): number {
    if (!this.hasDiscount(product)) return 0;
    return (product.compareAtPrice ?? 0) - product.price;
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
    return isInsideDhaka ? 60 : 120;
  }

  placeOrder(): void {
    if (this.isOrdering || !this.product) return;
    this.errorMessage = "";

    const sizes = Array.from(
      new Set(this.product.variants?.map((v) => v.size).filter(Boolean)),
    );

    const isSizeRequired = sizes.length > 0;

    const formRaw = this.checkoutForm.getRawValue();

    if (
      this.checkoutForm.invalid ||
      (isSizeRequired && !formRaw.selectedSize)
    ) {
      if (isSizeRequired && !formRaw.selectedSize) {
        this.errorMessage = "Please select a size.";
      }
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isOrdering = true;
    this.errorMessage = "";

    const form = this.checkoutForm.getRawValue();

    const cartItem: CartItem = {
      id: "landing-" + Date.now(),
      productId: this.product.id,
      name: this.product.name,
      price: this.currentPrice,
      quantity: form.quantity,
      size: form.selectedSize,
      imageUrl: this.product.imageUrl || "",
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

    const sizes = Array.from(
      new Set(this.product.variants?.map((v) => v.size).filter(Boolean)),
    );

    const isSizeRequired = sizes.length > 0;

    const formRaw = this.checkoutForm.getRawValue();

    if (
      (isSizeRequired && !formRaw.selectedSize)
    ) {
      if (isSizeRequired && !formRaw.selectedSize) {
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
        form.selectedSize,
      )
      .subscribe();
  }
}

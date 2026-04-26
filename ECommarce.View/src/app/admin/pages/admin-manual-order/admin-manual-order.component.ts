import { CommonModule } from "@angular/common";
import { Component, OnInit, OnDestroy, inject, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  switchMap,
  of,
  catchError,
  Observable,
  forkJoin,
} from "rxjs";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";

import { ProductsService } from "../../services/products.service";
import { OrdersService } from "../../services/orders.service";
import { AdminProduct } from "../../models/products.models";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { CustomerOrderApiService } from "../../../core/services/customer-order-api.service";
import { NotificationService } from "../../../core/services/notification.service";
import { DeliveryMethod } from "../../models/settings.models";
import { SettingsService } from "../../services/settings.service";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { BANGLADESH_LOCATIONS } from "../../../core/utils/bangladesh-locations";
import { SourceManagementService } from "../../../core/services/source-management.service";
import { SocialMediaSource, SourcePage } from "../../../core/models/order-source";

interface CartItem {
  product: AdminProduct;
  quantity: number;
  selectedSize?: string;
  unitPrice: number;
}

@Component({
  selector: "app-admin-manual-order",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AppIconComponent,
    PriceDisplayComponent,
  ],
  templateUrl: "./admin-manual-order.component.html",
})
export class AdminManualOrderComponent implements OnInit, OnDestroy {
  private productsService = inject(ProductsService);
  private ordersService = inject(OrdersService);
  private orderApi = inject(CustomerOrderApiService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private settingsService = inject(SettingsService);
  public imageUrlService = inject(ImageUrlService);
  private sourceService = inject(SourceManagementService);



  private destroy$ = new Subject<void>();
  isPreOrderMode = false;
  showPreOrderWarningModal = signal(false);
  outOfStockItems = signal<{name: string, size?: string, needed: number, stock: number}[]>([]);
  pendingOrderPayload: any = null;
  isEditMode = false;
  orderId: number | null = null;
  isLoadingProducts = false;
  isSubmitting = false;
  isLoading = false;

  // Search
  searchControl = new FormControl("");
  products = signal<AdminProduct[]>([]);
  
  // Cart
  cart = signal<CartItem[]>([]);

  // Variant Selection State
  selectedProduct = signal<AdminProduct | null>(null);
  selectedSize = signal<string | null>(null);
  
  // Form
  orderForm = new FormGroup({
    phone: new FormControl("", [Validators.required]),
    name: new FormControl("", [Validators.required]),
    address: new FormControl("", [Validators.required]),
    city: new FormControl(""),
    area: new FormControl(""),
    deliveryMethodId: new FormControl<number | null>(null, [Validators.required]),
    sourcePageId: new FormControl<number | null>(null),
    socialMediaSourceId: new FormControl<number | null>(null),
    noteType: new FormControl<"Customer" | "Official">("Official"),
    noteText: new FormControl(""),
    additionalDiscount: new FormControl(0),
    advancePayment: new FormControl(0),
  });

  deliveryMethods: DeliveryMethod[] = [];
  sourcePages: SourcePage[] = [];
  socialMediaSources: SocialMediaSource[] = [];

  // City/Area dropdown
  isCityDropdownOpen = false;
  isAreaDropdownOpen = false;
  citySearch = "";
  areaSearch = "";
  cities = Object.keys(BANGLADESH_LOCATIONS);
  areas: string[] = [];
  filteredCities: string[] = [];
  filteredAreas: string[] = [];

  ngOnInit(): void {
    this.filteredCities = this.cities;
    this.filteredAreas = this.areas;
    
    // Detect mode and edit
    this.isPreOrderMode = this.router.url.includes("pre-order");
    // Load data with forkJoin to avoid race conditions when editing
    const sources$ = forkJoin({
      pages: this.sourceService.getAllSourcePages(),
      sources: this.sourceService.getAllSocialMediaSources(),
      methods: this.settingsService.getDeliveryMethods()
    });

    sources$.subscribe({
      next: ({ pages, sources, methods }) => {
        this.sourcePages = pages;
        this.socialMediaSources = sources;
        this.deliveryMethods = methods;
        
        // If we are in edit mode, wait until sources are loaded before loading the order
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
          if (params["id"]) {
            this.isEditMode = true;
            this.orderId = +params["id"];
            this.loadOrderForEdit(this.orderId);
          } else if (methods.length > 0) {
            // Set default delivery method for new orders
            this.orderForm.patchValue({ deliveryMethodId: methods[0].id });
          }
        });
      },
      error: (err) => {
        console.error("Error loading sources:", err);
        this.notification.error("Failed to load order settings.");
      }
    });

    // Setup product search
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap((term) => {
          this.isLoadingProducts = true;
          return this.productsService.getProducts({
            searchTerm: term || "",
            category: "all",
            statusTab: "Active",
            stockStatus: "all",
            page: 1,
            pageSize: 50,
          }).pipe(
            catchError(() => of({ items: [], total: 0 }))
          );
        })
      )
      .subscribe((res) => {
        this.products.set(res.items);
        this.isLoadingProducts = false;
      });

    // Customer lookup by phone
    this.orderForm.get("phone")?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap((phone) => {
          if (!phone || phone.length < 11) return of(null);
          return this.orderApi.lookupCustomer(phone).pipe(
            catchError(() => of(null))
          );
        })
      )
      .subscribe((customer) => {
        if (customer) {
          this.orderForm.patchValue({
            name: customer.name,
            address: customer.address,
            city: customer.city || "",
            area: customer.area || "",
          }, { emitEvent: false });
          this.notification.info("Existing customer details loaded.");
        }
      });

    // Initial load
    this.searchControl.setValue("");
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCityDropdown() {
    this.isCityDropdownOpen = !this.isCityDropdownOpen;
    if (this.isCityDropdownOpen) {
      this.filteredCities = this.cities;
      this.citySearch = "";
    }
  }

  toggleAreaDropdown() {
    this.isAreaDropdownOpen = !this.isAreaDropdownOpen;
    if (this.isAreaDropdownOpen) {
      this.filteredAreas = this.areas;
      this.areaSearch = "";
    }
  }

  filterCities(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.citySearch = value;
    this.filteredCities = this.cities.filter(city => 
      city.toLowerCase().includes(value.toLowerCase())
    );
  }

  filterAreas(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.areaSearch = value;
    this.filteredAreas = this.areas.filter(area => 
      area.toLowerCase().includes(value.toLowerCase())
    );
  }

  selectCity(city: string) {
    this.orderForm.patchValue({ city, area: "" });
    this.isCityDropdownOpen = false;
    this.citySearch = "";
    
    // Auto-select delivery method
    if (this.deliveryMethods.length >= 2) {
      // 0 is usually Inside Dhaka, 1 is Outside Dhaka
      const isInsideDhaka = city.toLowerCase() === "dhaka";
      this.orderForm.patchValue({ deliveryMethodId: isInsideDhaka ? this.deliveryMethods[0].id : this.deliveryMethods[1].id });
    }

    // Update areas based on selected city
    this.areas = (BANGLADESH_LOCATIONS as any)[city] || [];
    this.filteredAreas = this.areas;
  }

  selectArea(area: string) {
    this.orderForm.patchValue({ area });
    this.isAreaDropdownOpen = false;
    this.areaSearch = "";
  }


  handleProductClick(product: AdminProduct) {
    const sizes = product.variants?.map(v => v.size).filter(s => !!s) || [];

    // If product has more than 1 size, ask for selection
    const uniqueSizes = [...new Set(sizes)];

    if (uniqueSizes.length <= 1) {
      this.addToCart(product, uniqueSizes[0] || undefined);
    } else {
      this.selectedProduct.set(product);
      this.selectedSize.set(uniqueSizes.length === 1 ? (uniqueSizes[0] || null) : null);
    }
  }

  get currentSelectedPrice(): number {
    const product = this.selectedProduct();
    if (!product) return 0;

    const size = this.selectedSize();
    if (size) {
      const variant = product.variants?.find((v) => v.size === size);
      if (variant && variant.price) return variant.price;
    }

    return product.price;
  }

  addToCart(product: AdminProduct, size?: string) {
    if (product.variants?.length && product.variants.some(v => v.size) && !size) {
      this.notification.error("Please select a size first.");
      return;
    }

    let price = product.price;

    // Lookup variant price if size is selected
    if (size) {
      const variant = product.variants?.find((v) => v.size === size);
      if (variant && variant.price) {
        price = variant.price;
      }
    }

    const existing = this.cart().find(
      (i) =>
        i.product.id === product.id &&
        i.selectedSize === size,
    );

    if (existing) {
      this.updateQuantity(existing, 1);
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        selectedSize: size,
        unitPrice: price,
      };
      this.cart.update((c) => [...c, newItem]);
    }

    // Reset selection state
    this.selectedProduct.set(null);
    this.selectedSize.set(null);
    this.notification.info(`${product.name} added to cart.`);
  }

  removeFromCart(item: CartItem) {
    this.cart.update(c => c.filter(i => i !== item));
  }

  clearCart() {
    this.cart.set([]);
    this.notification.info("Cart cleared.");
  }

  updateQuantity(item: CartItem, delta: number) {
    this.cart.update(c => c.map(i => {
      if (i === item) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  }

  get subtotal() {
    return this.cart().reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }

  get shippingCost() {
    const methodId = this.orderForm.get("deliveryMethodId")?.value;
    const method = this.deliveryMethods.find(m => m.id === methodId);
    return method?.cost || 0;
  }

  get total() {
    const discount = this.orderForm.get('additionalDiscount')?.value || 0;
    return Math.max(0, this.subtotal + this.shippingCost - discount);
  }

  get dueAmount() {
    const paid = this.orderForm.get('advancePayment')?.value || 0;
    return Math.max(0, this.total - paid);
  }

  onPriceChange() {
    // Totals are calculated via getters, but we need to trigger signal update
    this.cart.update(c => [...c]);
  }

  submitOrder() {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      this.notification.error("Please fill in all customer details.");
      return;
    }

    if (this.cart().length === 0) {
      this.notification.error("Cart is empty. Please add products.");
      return;
    }

    this.isSubmitting = true;
    const payload = {
      name: this.orderForm.value.name!,
      phone: this.orderForm.value.phone!,
      address: this.orderForm.value.address!,
      city: this.orderForm.value.city!,
      area: this.orderForm.value.area!,
      deliveryMethodId: this.orderForm.value.deliveryMethodId!,
      itemsCount: this.cart().reduce((sum, i) => sum + i.quantity, 0),
      total: this.total,
      isPreOrder: this.isPreOrderMode,
      sourcePageId: this.orderForm.value.sourcePageId,
      socialMediaSourceId: this.orderForm.value.socialMediaSourceId,
      discount: this.orderForm.value.additionalDiscount || 0,
      advancePayment: this.orderForm.value.advancePayment || 0,
      adminNote: this.orderForm.value.noteType === "Official" && this.orderForm.value.noteText ? this.orderForm.value.noteText : undefined,
      customerNote: this.orderForm.value.noteType === "Customer" && this.orderForm.value.noteText ? this.orderForm.value.noteText : undefined,
      items: this.cart().map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        size: i.selectedSize,
        unitPrice: i.unitPrice,
      }))
    };

    const outOfStockList: {name: string, size?: string, needed: number, stock: number}[] = [];
    
    this.cart().forEach(item => {
      let stock = item.product.stockQuantity;
      if (item.selectedSize) {
         const variant = item.product.variants?.find(v => v.size === item.selectedSize);
         stock = variant ? variant.stockQuantity : 0;
      }
      
      if (stock < item.quantity) {
        outOfStockList.push({
          name: item.product.name,
          size: item.selectedSize,
          needed: item.quantity,
          stock: Math.max(0, stock)
        });
      }
    });

    if (outOfStockList.length > 0 && !this.isPreOrderMode) {
      this.pendingOrderPayload = payload;
      this.outOfStockItems.set(outOfStockList);
      this.showPreOrderWarningModal.set(true);
      return;
    }

    this.executeOrder(payload);
  }

  confirmOrder() {
    this.showPreOrderWarningModal.set(false);
    if (this.pendingOrderPayload) {
      this.executeOrder(this.pendingOrderPayload);
      this.pendingOrderPayload = null;
    }
  }

  cancelOrder() {
    this.showPreOrderWarningModal.set(false);
    this.pendingOrderPayload = null;
    this.isSubmitting = false;
  }

  private executeOrder(payload: any) {
    const request = this.isEditMode && this.orderId
      ? this.ordersService.updateOrder(this.orderId, payload)
      : this.orderApi.placeOrder(payload);

    (request as Observable<any>).subscribe({
      next: (res: any) => {
        this.notification.success(`Order ${res.orderNumber} ${this.isEditMode ? 'updated' : 'created'} successfully!`);
        this.router.navigate(["/admin/orders"]);
      },
      error: (err: any) => {
        this.notification.error(err.error?.message || `Failed to ${this.isEditMode ? 'update' : 'create'} order.`);
        this.isSubmitting = false;
      }
    });
  }

  private loadOrderForEdit(id: number) {
    this.isLoading = true;
    this.ordersService.getOrderById(id).subscribe({
      next: (order: any) => {
        console.log("Loading order for edit:", order);
        this.orderForm.patchValue({
          phone: order.customerPhone,
          name: order.customerName,
          address: order.shippingAddress,
          city: order.city || "",
          area: order.area || "",
          sourcePageId: order.sourcePageId || null,
          socialMediaSourceId: order.socialMediaSourceId || null,
          noteType: order.customerNote ? "Customer" : "Official",
          noteText: order.customerNote || order.adminNote || "",
          additionalDiscount: order.discount || 0,
          advancePayment: order.advancePayment || 0
        });

        if (order.city) {
            const cleanCity = order.city.trim();
            const cityKey = Object.keys(BANGLADESH_LOCATIONS).find(k => k.toLowerCase() === cleanCity.toLowerCase());
            if (cityKey) {
              this.areas = (BANGLADESH_LOCATIONS as any)[cityKey] || [];
              this.filteredAreas = this.areas;
            }
        }

        // Map items to cart
        const cartItems: CartItem[] = (order.items || []).map((item: any) => ({
          product: { 
            id: item.productId, 
            name: item.productName, 
            price: item.unitPrice, 
            imageUrl: item.imageUrl 
          } as any,
          quantity: item.quantity,
          selectedSize: item.size,
          unitPrice: item.unitPrice
        }));
        this.cart.set(cartItems);

        // Selection of delivery method
        if (order.deliveryMethodId) {
          this.orderForm.patchValue({ deliveryMethodId: order.deliveryMethodId });
        } else {
          const method = this.deliveryMethods.find(m => m.cost === order.shippingCost);
          if (method) this.orderForm.patchValue({ deliveryMethodId: method.id });
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error("Error loading order:", err);
        this.notification.error("Failed to load order for editing");
        this.isLoading = false;
      }
    });
  }
}

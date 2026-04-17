import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LucideAngularModule, X, Search, ChevronDown, ChevronUp } from "lucide-angular";
import { BANGLADESH_LOCATIONS } from "../../../../core/utils/bangladesh-locations";
import { OrderService } from "../../../../core/services/order.service";
import { OrderItem } from "../../../../core/models/order";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { CustomerProfileService } from "../../../../core/services/customer-profile.service";

import { CustomerOrderApiService } from "../../../../core/services/customer-order-api.service";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";

interface OfferDetails {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  price: number;
  badge: string;
  productId: number;
}

const OFFERS: OfferDetails[] = [
  {
    slug: "midnight-luxe-set",
    title: "Midnight Luxe Co-Ord Set",
    subtitle: "Exclusive drop for the weekend campaign",
    description:
      "A breathable satin blend with tailored lines that transitions from day to evening. Limited inventory with bundled pricing just for this pop-up.",
    imageUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80",
    price: 89,
    badge: "Pop-up exclusive",
    productId: 1, // Placeholder for the Midnight Luxe set in DB
  },
];



@Component({
  selector: "app-offer-details-page",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./offer-details-page.component.html",
  styleUrl: "./offer-details-page.component.css",
})
export class OfferDetailsPageComponent {
  readonly icons = {
    X: X,
    Search: Search,
    ChevronDown: ChevronDown,
    ChevronUp: ChevronUp,
  };
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly customerOrderApi = inject(CustomerOrderApiService);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly profileService = inject(CustomerProfileService);

  offer: OfferDetails | null = null;
  isLoading = false;
  errorMessage = "";
  successMessage = "";

  readonly orderForm = this.formBuilder.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    city: ["Dhaka"],
    area: [""],
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
    size: ["M", [Validators.required]],
    color: ["Default"],
  });

  cities = Object.keys(BANGLADESH_LOCATIONS).sort();
  filteredCities: string[] = [];
  citySearch = "";
  isCityDropdownOpen = false;

  areas: string[] = [];
  filteredAreas: string[] = [];
  areaSearch = "";
  isAreaDropdownOpen = false;

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const slug = params.get("slug");
        this.offer = OFFERS.find((item) => item.slug === slug) ?? null;
        if (!this.offer) {
          void this.router.navigate(["/"]);
        }
      });

    this.orderForm.controls.city.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((city) => {
        this.areas = BANGLADESH_LOCATIONS[city] || [];
        this.filteredAreas = [...this.areas];
        this.orderForm.patchValue({ area: "" });
        this.areaSearch = "";
        this.citySearch = city; // Keep search input synced
      });

    // Initialize areas for default city
    this.areas = BANGLADESH_LOCATIONS["Dhaka"] || [];
    this.filteredAreas = [...this.areas];
  }

  get total(): number {
    if (!this.offer) {
      return 0;
    }
    const quantity = this.orderForm.controls.quantity.value ?? 1;
    return this.offer.price * quantity;
  }

  filterCities(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.citySearch = query;
    this.filteredCities = this.cities.filter(c => c.toLowerCase().includes(query));
  }

  selectCity(city: string): void {
    this.orderForm.patchValue({ city });
    this.citySearch = city;
    this.isCityDropdownOpen = false;
  }

  toggleCityDropdown(): void {
    this.isCityDropdownOpen = !this.isCityDropdownOpen;
    if (this.isCityDropdownOpen) {
      this.isAreaDropdownOpen = false; // Close other
      this.filteredCities = [...this.cities];
      this.citySearch = this.orderForm.get('city')?.value || "";
    }
  }

  filterAreas(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.areaSearch = query;
    this.filteredAreas = this.areas.filter(a => a.toLowerCase().includes(query));
  }

  selectArea(area: string): void {
    this.orderForm.patchValue({ area });
    this.areaSearch = area;
    this.isAreaDropdownOpen = false;
  }

  toggleAreaDropdown(): void {
    if (!this.orderForm.get('city')?.value) return;
    this.isAreaDropdownOpen = !this.isAreaDropdownOpen;
    if (this.isAreaDropdownOpen) {
      this.isCityDropdownOpen = false; // Close other
      this.filteredAreas = [...this.areas];
      this.areaSearch = this.orderForm.get('area')?.value || "";
    }
  }

  submitOrder(): void {
    if (this.orderForm.invalid || !this.offer || this.isLoading) {
      this.orderForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.successMessage = "";

    const quantity = this.orderForm.controls.quantity.value ?? 1;
    const size = this.orderForm.controls.size.value ?? "";

    this.customerOrderApi
      .placeOrder({
        name: this.orderForm.controls.fullName.value,
        phone: this.orderForm.controls.phone.value,
        address: this.orderForm.controls.address.value,
        city: this.orderForm.controls.city.value,
        area: this.orderForm.controls.area.value,
        itemsCount: quantity,
        total: this.total,
        items: [
          {
            productId: this.offer.productId,
            quantity: quantity,
            color: this.orderForm.controls.color.value ?? "Default",
            size: this.orderForm.controls.size.value ?? "M",
          },
        ],
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.profileService.storePhone(this.orderForm.controls.phone.value);

          // Build a virtual OrderItem for consistent confirmation display
          const virtualItem: OrderItem = {
            productId: 0,
            productName: this.offer?.title ?? "Special Offer",
            unitPrice: this.offer?.price ?? 0,
            quantity: quantity,
            color: "",
            size: size,
            imageUrl: this.offer?.imageUrl ?? "",
            totalPrice: this.total,
          };

          // Save to history so confirmation page can find it
          this.orderService.buildAndSaveOrder(
            response,
            [virtualItem],
            this.total,
            0,
            0,
          );

          void this.router.navigate(["/order-confirmation", response.id]);

          this.orderForm.reset({
            fullName: "",
            phone: "",
            address: "",
            quantity: 1,
            size: "M",
          });
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = "Unable to place the order. Please try again.";
        },
      });
  }
}

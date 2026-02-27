import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

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
  },
];

import { ImageUrlService } from "../../../../core/services/image-url.service";
import { CustomerProfileService } from "../../../../core/services/customer-profile.service";

import { LucideAngularModule, X } from "lucide-angular";

import { OrderService } from "../../../../core/services/order.service";
import { OrderItem } from "../../../../core/models/order";

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
    X,
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
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
    size: ["M", [Validators.required]],
    additionalDetails: [""],
  });

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
  }

  get total(): number {
    if (!this.offer) {
      return 0;
    }
    const quantity = this.orderForm.controls.quantity.value ?? 1;
    return this.offer.price * quantity;
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
    const additional = this.orderForm.controls.additionalDetails.value?.trim();

    this.customerOrderApi
      .placeOrder({
        name: this.orderForm.controls.fullName.value,
        phone: this.orderForm.controls.phone.value,
        address: this.orderForm.controls.address.value,
        itemsCount: quantity,
        total: this.total,
        items: [],
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

          void this.router.navigate(["/order-confirmation", response.orderId]);

          this.orderForm.reset({
            fullName: "",
            phone: "",
            address: "",
            quantity: 1,
            size: "M",
            additionalDetails: "",
          });
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = "Unable to place the order. Please try again.";
        },
      });
  }
}

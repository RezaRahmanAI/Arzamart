import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { NgClass } from "@angular/common";
import { RouterLink } from "@angular/router";

import {
  Product,
  RelatedProduct,
  ProductVariant,
} from "../../../core/models/product";
import { PriceDisplayComponent } from "../price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { CartService } from "../../../core/services/cart.service";
import { QuickAddModalComponent } from "../quick-add-modal/quick-add-modal.component";
import { AppIconComponent } from "../app-icon/app-icon.component";
import { sortProductSizes } from "../../../core/constants/product.constants";

@Component({
  selector: "app-product-card",
  standalone: true,
  imports: [
    NgClass,
    RouterLink,
    PriceDisplayComponent,
    AppIconComponent,
    QuickAddModalComponent,
  ],
  templateUrl: "./product-card.component.html",
  styleUrl: "./product-card.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product | RelatedProduct;
  selectedSize: string | null = null;

  showQuickAdd = false;
  isOrdering = false;

  constructor(
    public readonly imageUrlService: ImageUrlService,
    private readonly cartService: CartService,
  ) {}

  ngOnInit() {
    // Select the default or smallest size on init
    const defaultVariant = this.smallestVariant;
    if (defaultVariant && defaultVariant.size) {
      this.selectedSize = defaultVariant.size;
    }
  }

  get mainImage(): string | null {
    return (
      this.product.imageUrl ||
      ("images" in this.product && this.product.images.length > 0
        ? this.product.images[0].imageUrl
        : null)
    );
  }

  get fallbackImageUrl(): string {
    return "imageUrl" in this.product ? this.product.imageUrl || "" : "";
  }

  private get variants(): ProductVariant[] | undefined {
    return "variants" in this.product ? this.product.variants : undefined;
  }

  private get smallestVariant(): ProductVariant | null {
    const variants = this.variants;
    if (!variants || !variants.length) return null;

    const sorted = sortProductSizes(variants.map(v => v.size || ""))
      .map(size => variants.find(v => (v.size || "") === size)!)
      .filter(v => !!v);

    return sorted[0] ?? null;
  }

  get hoverVariant(): ProductVariant | null {
    const variants = this.variants;
    if (!variants || !variants.length) return null;
    if (this.selectedSize) {
      const selected = variants.find(
        (v) =>
          (v.size || "").trim().toLowerCase() ===
          (this.selectedSize || "").trim().toLowerCase(),
      );
      if (selected) return selected;
    }
    return this.smallestVariant;
  }

  get hasDiscount(): boolean {
    const compareAtPrice = this.originalPrice;
    return !!(
      compareAtPrice &&
      compareAtPrice > 0 &&
      compareAtPrice > this.currentPrice
    );
  }

  get discountPercentage(): number {
    if (!this.hasDiscount) return 0;
    const price = this.currentPrice;
    const compareAtPrice = this.originalPrice;
    const discount = (compareAtPrice ?? 0) - price;
    return Math.round((discount / (compareAtPrice || 1)) * 100);
  }

  get discountAmount(): number {
    if (!this.hasDiscount) return 0;
    const price = this.currentPrice;
    const compareAtPrice = this.originalPrice;
    return (compareAtPrice ?? 0) - price;
  }

  get originalPrice(): number {
    const variant = this.hoverVariant;
    if (variant?.compareAtPrice && variant.compareAtPrice > 0)
      return variant.compareAtPrice;

    if (
      "compareAtPrice" in this.product &&
      this.product.compareAtPrice &&
      this.product.compareAtPrice > 0
    ) {
      return this.product.compareAtPrice;
    }

    // Fallback to highest variant compare price if available
    const variants = this.variants;
    if (variants && variants.length > 0) {
      const maxCompare = Math.max(
        ...variants.map((v) => v.compareAtPrice || 0),
      );
      if (maxCompare > 0) return maxCompare;
    }

    return 0;
  }

  get currentPrice(): number {
    const variant = this.hoverVariant;

    // 1. Try selected/smallest variant price
    if (variant?.price && variant.price > 0) {
      return variant.price;
    }

    // 2. Try product base price
    if ("price" in this.product && this.product.price > 0) {
      return this.product.price;
    }

    // 3. Last resort: any non-zero variant price
    const variants = this.variants;
    if (variants && variants.length > 0) {
      const firstValidPrice = variants.find(
        (v) => v.price && v.price > 0,
      )?.price;
      if (firstValidPrice) return firstValidPrice;
    }

    return 0;
  }

  get currentStock(): number {
    const variant = this.hoverVariant;
    if (variant) return variant.stockQuantity;

    if ("stockQuantity" in this.product) {
      return (this.product as any).stockQuantity;
    }

    const variants = this.variants;
    if (variants && variants.length > 0) {
      return variants.reduce((sum, v) => sum + v.stockQuantity, 0);
    }

    return 0;
  }

  get availableSizes(): string[] {
    const variants = this.variants;
    if (!variants || !variants.length) return [];

    const uniqueSizes = variants
      .filter((v: ProductVariant) => v.size && v.size.trim() !== "")
      .map((v: ProductVariant) => v.size as string)
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);

    return sortProductSizes(uniqueSizes);
  }

  get description(): string {
    const desc =
      "shortDescription" in this.product && this.product.shortDescription
        ? this.product.shortDescription
        : "description" in this.product && this.product.description
          ? this.product.description
          : "";

    // Strip HTML tags for preview
    return desc.replace(/<[^>]*>/g, "");
  }

  selectSize(size: string): void {
    this.selectedSize = size;
  }

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const sizes = this.availableSizes;
    if (sizes.length > 0 && !this.selectedSize) {
      this.showQuickAdd = true;
      return;
    }

    if ("id" in this.product) {
      this.cartService
        .addItem(this.product as Product, 1, this.selectedSize ?? undefined)
        .subscribe();
    }
  }

  onQuickAddConfirm(selection: { size?: string; quantity: number }): void {
    if ("id" in this.product) {
      this.showQuickAdd = false;
      this.cartService
        .addItem(
          this.product as Product,
          selection.quantity,
          selection.size ?? this.selectedSize ?? undefined,
        )
        .subscribe(() => {
          if (this.isOrdering) {
            window.location.href = "/checkout";
          }
        });
    }
  }

  orderNow(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.isOrdering = true;
    this.showQuickAdd = true;
  }
}

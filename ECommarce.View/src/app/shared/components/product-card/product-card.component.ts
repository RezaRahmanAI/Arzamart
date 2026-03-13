import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

import {
  Product,
  RelatedProduct,
  ProductVariant,
} from "../../../core/models/product";
import { BadgeComponent } from "../badge/badge.component";
import { IconButtonComponent } from "../icon-button/icon-button.component";
import { PriceDisplayComponent } from "../price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { CartService } from "../../../core/services/cart.service";
import { LucideAngularModule, ShoppingCart } from "lucide-angular";

@Component({
  selector: "app-product-card",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./product-card.component.html",
  styleUrl: "./product-card.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product | RelatedProduct;
  selectedSize: string | null = null;

  readonly icons = { ShoppingCart };

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

  get selectedColorName(): string {
    if ("images" in this.product && this.product.images?.length > 0) {
      return this.product.images.find((i) => i.color)?.color ?? "";
    }
    return "";
  }

  private get variants(): ProductVariant[] | undefined {
    return "variants" in this.product ? this.product.variants : undefined;
  }

  private get smallestVariant(): ProductVariant | null {
    const variants = this.variants;
    if (!variants || !variants.length) return null;

    // Just sort by size, because price filtering strictly removes 0 prices which may validly fallback to product.price
    const sizeOrder = [
      "xs",
      "s",
      "m",
      "l",
      "xl",
      "xxl",
      "2xl",
      "3xl",
      "4xl",
      "5xl",
    ];

    const sorted = [...variants].sort((a, b) => {
      const aIdx = sizeOrder.indexOf((a.size || "").toLowerCase());
      const bIdx = sizeOrder.indexOf((b.size || "").toLowerCase());
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return (a.size || "").localeCompare(b.size || "");
    });

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

  get availableSizes(): string[] {
    const variants = this.variants;
    if (!variants || !variants.length) return [];

    const sizeOrder = [
      "xs",
      "s",
      "m",
      "l",
      "xl",
      "xxl",
      "2xl",
      "3xl",
      "4xl",
      "5xl",
    ];

    return variants
      .filter((v: ProductVariant) => v.size && v.size.trim() !== "")
      .map((v: ProductVariant) => v.size as string)
      .filter(
        (value: string, index: number, self: string[]) =>
          self.indexOf(value) === index,
      ) // Unique sizes
      .sort((a: string, b: string) => {
        const aIdx = sizeOrder.indexOf(a.toLowerCase());
        const bIdx = sizeOrder.indexOf(b.toLowerCase());
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.localeCompare(b);
      });
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

    if ("id" in this.product) {
      this.cartService
        .addItem(
          this.product as Product,
          1,
          this.selectedColorName,
          this.selectedSize ?? undefined,
        )
        .subscribe();
    }
  }
}

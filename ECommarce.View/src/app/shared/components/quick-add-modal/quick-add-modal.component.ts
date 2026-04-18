import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { Product, ProductImage, ProductVariant } from "../../../core/models/product";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { PriceDisplayComponent } from "../price-display/price-display.component";
import { AppIconComponent } from "../app-icon/app-icon.component";

@Component({
  selector: "app-quick-add-modal",
  standalone: true,
  imports: [PriceDisplayComponent, AppIconComponent],
  template: `
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        (click)="close.emit()"
      ></div>

      <!-- Modal Content -->
      <div
        class="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden transform transition-all duration-500 ease-out"
      >
        <!-- Close Button -->
        <button
          (click)="close.emit()"
          class="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-black transition-colors"
        >
          <app-icon name="X" size="20"></app-icon>
        </button>

        <div class="flex flex-col sm:flex-row h-full">
          <!-- Product Image Preview -->
          <div class="w-full sm:w-1/2 aspect-[3/4] bg-gray-50">
            <img
              [src]="imageUrlService.getImageUrl(selectedImage || product.imageUrl || '')"
              [alt]="product.name"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- Selection Details -->
          <div class="flex-1 p-6 flex flex-col justify-center">
            <h2 class="text-sm uppercase tracking-[0.2em] font-bold text-gray-400 mb-1">
              Quick Add
            </h2>
            <h3 class="text-xl font-bold text-black mb-2">{{ product.name }}</h3>
            
            <div class="flex items-center gap-2 mb-6">
              <app-price-display
                [amount]="currentPrice"
                class="text-lg font-bold block"
              ></app-price-display>
              @if (originalPrice > 0) {
                <app-price-display
                  [amount]="originalPrice"
                  size="sm"
                  class="line-through opacity-50"
                ></app-price-display>
              }
            </div>

            <!-- Size Selection -->
            @if (availableSizes.length > 0) {
              <div class="mb-8">
                <label class="text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-3">
                  Select Size: <span class="text-black">{{ selectedSize || 'required' }}</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  @for (size of availableSizes; track size) {
                    <button
                      (click)="selectSize(size)"
                      class="min-w-10 h-10 px-2 flex items-center justify-center border text-[11px] font-bold transition-all duration-300 rounded-lg"
                      [class.bg-primary]="selectedSize === size"
                      [class.text-white]="selectedSize === size"
                      [class.border-primary]="selectedSize === size"
                      [class.bg-white]="selectedSize !== size"
                      [class.text-primary]="selectedSize !== size"
                      [class.border-gray-200]="selectedSize !== size"
                      [class.hover:border-primary]="selectedSize !== size"
                    >
                      {{ size }}
                    </button>
                  }
                </div>
              </div>
            }

            <button
              (click)="confirm()"
              [disabled]="availableSizes.length > 0 && !selectedSize"
              class="w-full py-4 bg-accent text-white text-[11px] uppercase tracking-[0.3em] font-bold transition-all duration-300 hover:opacity-90 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-accent/20"
            >
              <app-icon name="ShoppingBag" size="16"></app-icon>
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class QuickAddModalComponent {
  @Input({ required: true }) product!: Product;
  @Input() set initialSize(val: string | null) {
    if (val) this.selectedSize = val;
  }
  @Output() close = new EventEmitter<void>();
  @Output() added = new EventEmitter<{ size?: string }>();

  readonly imageUrlService = inject(ImageUrlService);

  selectedSize: string | null = null;
  selectedImage: string | null = null;



  get availableSizes(): string[] {
    const variants = this.product.variants;
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

  get selectedVariant(): ProductVariant | null {
    if (!this.selectedSize || !this.product.variants) return null;
    return (
      this.product.variants.find(
        (v) =>
          (v.size || "").trim().toLowerCase() ===
          this.selectedSize?.trim().toLowerCase(),
      ) || null
    );
  }

  get currentPrice(): number {
    const variant = this.selectedVariant;
    if (variant?.price && variant.price > 0) return variant.price;
    return this.product.price;
  }

  get originalPrice(): number {
    const variant = this.selectedVariant;
    if (variant?.compareAtPrice && variant.compareAtPrice > 0)
      return variant.compareAtPrice;

    if (this.product.compareAtPrice && this.product.compareAtPrice > 0)
      return this.product.compareAtPrice;

    return 0;
  }



  selectSize(size: string): void {
    this.selectedSize = size;
  }

  confirm(): void {
    const sizeValid = this.availableSizes.length === 0 || !!this.selectedSize;

    if (sizeValid) {
      this.added.emit({
        size: this.selectedSize || undefined,
      });
    }
  }
}

import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { Product, ProductImage, ProductVariant } from "../../../core/models/product";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { PriceDisplayComponent } from "../price-display/price-display.component";
import { AppIconComponent } from "../app-icon/app-icon.component";
import { sortProductSizes } from "../../../core/constants/product.constants";

@Component({
  selector: "app-quick-add-modal",
  standalone: true,
  imports: [PriceDisplayComponent, AppIconComponent],
  template: `
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
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
        class="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden transform transition-all duration-500 ease-out max-h-[90vh] sm:max-h-[90vh] flex flex-col sm:flex-row rounded-2xl sm:rounded-3xl"
      >
        <!-- Close Button -->
        <button
          (click)="close.emit()"
          class="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 bg-white/70 backdrop-blur-md sm:bg-transparent rounded-full sm:rounded-none text-gray-600 sm:text-gray-400 hover:text-black transition-colors"
        >
          <app-icon name="X" size="20"></app-icon>
        </button>

        <!-- Product Image Preview -->
        <div class="w-full sm:w-1/2 h-[25vh] min-h-[160px] sm:min-h-0 sm:h-auto sm:aspect-[3/4] bg-gray-50 flex-shrink-0 relative p-2 sm:p-0">
          <!-- Ekhane object-cover er bodole object-contain deya hoyeche -->
          <img
            [src]="imageUrlService.getImageUrl(selectedImage || product.imageUrl || '')"
            [alt]="product.name"
            class="w-full h-full object-contain sm:object-cover mix-blend-multiply"
          />
        </div>

        <!-- Selection Details (Scrollable independent of image) -->
        <div class="flex-1 p-4 sm:p-6 flex flex-col justify-start sm:justify-center overflow-y-auto pb-6 sm:pb-8">
          <h2 class="text-[10px] sm:text-sm uppercase tracking-[0.2em] font-bold text-gray-400 mb-0.5 sm:mb-1">
            Quick Add
          </h2>
          <h3 class="text-sm sm:text-lg font-bold text-black mb-1 sm:mb-2 leading-tight">{{ product.name }}</h3>
          
          <div class="flex items-center gap-2 mb-3 sm:mb-4">
            <app-price-display
              [amount]="currentPrice"
              class="text-base sm:text-lg font-bold block"
            ></app-price-display>
            @if (originalPrice > 0) {
              <app-price-display
                [amount]="originalPrice"
                size="sm"
                class="line-through opacity-50 text-[10px] sm:text-sm"
              ></app-price-display>
            }
          </div>

          <!-- Size Selection -->
          @if (availableSizes.length > 0) {
            <div class="mb-3 sm:mb-5">
              <label class="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-2 sm:mb-3">
                Select Size: <span class="text-black">{{ selectedSize || 'required' }}</span>
              </label>
              <div class="flex flex-wrap gap-1.5 sm:gap-2">
                @for (size of availableSizes; track size) {
                  <button
                    (click)="selectSize(size)"
                    class="min-w-[2.25rem] h-8 sm:min-w-10 sm:h-10 px-2 flex items-center justify-center border text-[10px] sm:text-[11px] font-bold transition-all duration-300 rounded-md sm:rounded-lg"
                    [class.bg-ds-accent]="selectedSize === size"
                    [class.text-ds-hero-text]="selectedSize === size"
                    [class.border-ds-accent]="selectedSize === size"
                    [class.bg-ds-bg]="selectedSize !== size"
                    [class.text-ds-text]="selectedSize !== size"
                    [class.border-ds-border]="selectedSize !== size"
                    [class.hover:border-ds-accent]="selectedSize !== size"
                  >
                    {{ size }}
                  </button>
                }
              </div>
            </div>
          }

          <!-- Quantity Selection -->
          <div class="mb-4 sm:mb-6 mt-4 sm:mt-0">
            <label class="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-2 sm:mb-3">
              Quantity
            </label>
            <div class="flex items-center gap-3 sm:gap-4">
              <button 
                (click)="decreaseQuantity()"
                class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-ds-border rounded-md sm:rounded-lg text-ds-text-sec hover:text-ds-text transition-colors"
              >
                <app-icon name="Minus" size="14"></app-icon>
              </button>
              <span class="text-sm sm:text-lg font-bold w-6 sm:w-8 text-center">{{ quantity }}</span>
              <button 
                (click)="increaseQuantity()"
                class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-ds-border rounded-md sm:rounded-lg text-ds-text-sec hover:text-ds-text transition-colors"
              >
                <app-icon name="Plus" size="14"></app-icon>
              </button>
            </div>
          </div>

          <button
            (click)="confirm()"
            [disabled]="availableSizes.length > 0 && !selectedSize"
            class="w-full py-2.5 sm:py-4 bg-ds-accent text-white text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-bold transition-all duration-300 hover:opacity-90 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-lg sm:rounded-xl shadow-lg shadow-ds-accent/20"
          >
            <app-icon name="ShoppingBag" size="14" class="sm:w-4 sm:h-4"></app-icon>
            {{ (selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity) > 0 ? 'Confirm Selection' : 'Confirm Pre-order' }}
          </button>
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
  @Output() added = new EventEmitter<{ size?: string; quantity: number }>();

  readonly imageUrlService = inject(ImageUrlService);

  selectedSize: string | null = null;
  selectedImage: string | null = null;
  quantity = 1;

  get availableSizes(): string[] {
    const variants = this.product.variants;
    if (!variants || !variants.length) return [];

    const uniqueSizes = variants
      .filter((v: ProductVariant) => v.size && v.size.trim() !== "")
      .map((v: ProductVariant) => v.size as string)
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);

    return sortProductSizes(uniqueSizes);
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

  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  confirm(): void {
    const sizeValid = this.availableSizes.length === 0 || !!this.selectedSize;

    if (sizeValid) {
      this.added.emit({
        size: this.selectedSize || undefined,
        quantity: this.quantity,
      });
    }
  }
}
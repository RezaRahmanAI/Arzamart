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
        class="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden transform transition-all duration-500 ease-out max-h-[95vh] sm:max-h-[90vh] flex flex-col sm:flex-row rounded-2xl sm:rounded-3xl"
      >
        <!-- Close Button -->
        <button
          (click)="close.emit()"
          class="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 bg-white/70 backdrop-blur-md sm:bg-transparent rounded-full sm:rounded-none text-gray-600 sm:text-gray-400 hover:text-black transition-colors"
        >
          <app-icon name="X" size="20"></app-icon>
        </button>

        <!-- Product Image Preview -->
        <div class="w-full sm:w-1/2 h-[30vh] sm:h-auto bg-gray-50 flex-shrink-0 relative group">
          <img
            [src]="imageUrlService.getImageUrl(selectedImage || product.imageUrl || '')"
            [alt]="product.name"
            class="w-full h-full object-contain sm:object-cover mix-blend-multiply transition-all duration-500"
          />
          
          <!-- Image Dots -->
          @if (product.images.length > 1) {
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              @for (img of product.images; track img.id; let i = $index) {
                <button type="button" (click)="selectImage(img.imageUrl)"
                        class="w-2 h-2 rounded-full transition-all duration-300"
                        [style.backgroundColor]="(selectedImage || product.imageUrl) === img.imageUrl ? '#1E6FD9' : 'rgba(0,0,0,0.2)'"
                        [style.transform]="(selectedImage || product.imageUrl) === img.imageUrl ? 'scale(1.25)' : 'scale(1)'"></button>
              }
            </div>
          }
        </div>

        <!-- Selection Details (Scrollable independent of image) -->
        <div class="flex-1 p-4 sm:p-8 flex flex-col overflow-y-auto custom-scrollbar">
          <div class="mb-4 sm:mb-6">
            <h2 class="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1.5 sm:mb-2 font-bold">
              Product Overview
            </h2>
            <h3 class="text-lg sm:text-2xl text-black font-bold mb-1 sm:mb-2 leading-tight">{{ product.name }}</h3>
            
            <div class="flex items-center gap-3">
              <app-price-display
                [amount]="currentPrice"
                class="text-lg sm:text-xl font-bold text-ds-accent"
              ></app-price-display>
              @if (originalPrice > 0) {
                <app-price-display
                  [amount]="originalPrice"
                  size="sm"
                  class="line-through opacity-40"
                ></app-price-display>
              }
            </div>
          </div>

          <!-- Description Section -->
          @if (product.description) {
            <div class="mb-8">
              <h4 class="text-xs font-bold text-black uppercase tracking-wider mb-3 flex items-center gap-2">
                <app-icon name="FileText" size="14"></app-icon>
                Description
              </h4>
              <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {{ product.description }}
              </p>
            </div>
          }

          <!-- Size Selection -->
          @if (availableSizes.length > 0) {
            <div class="mb-8">
              <label class="text-xs font-bold text-black uppercase tracking-wider mb-4 block">
                Select Size: <span class="text-ds-accent ml-1">{{ selectedSize || 'Required' }}</span>
              </label>
              <div class="flex flex-wrap gap-2">
                @for (size of availableSizes; track size) {
                  <button
                    (click)="selectSize(size)"
                    class="min-w-[3rem] h-11 px-3 flex items-center justify-center border transition-all duration-300 rounded-lg text-sm font-medium"
                    [class.bg-ds-accent]="selectedSize === size"
                    [class.text-white]="selectedSize === size"
                    [class.border-ds-accent]="selectedSize === size"
                    [class.bg-white]="selectedSize !== size"
                    [class.text-gray-700]="selectedSize !== size"
                    [class.border-gray-200]="selectedSize !== size"
                    [class.hover:border-ds-accent]="selectedSize !== size"
                  >
                    {{ size }}
                  </button>
                }
              </div>
            </div>
          }

          <!-- Extra Info Tabs/Sections -->
          @if (product.fabricAndCare || product.shippingAndReturns) {
            <div class="space-y-4 mb-8">
              @if (product.fabricAndCare) {
                <div class="p-4 bg-gray-50 rounded-xl">
                  <h4 class="text-xs font-bold text-black mb-2 flex items-center gap-2">
                    <app-icon name="Wind" size="14"></app-icon>
                    Fabric & Care
                  </h4>
                  <p class="text-xs text-gray-500 leading-relaxed">{{ product.fabricAndCare }}</p>
                </div>
              }
              @if (product.shippingAndReturns) {
                <div class="p-4 bg-gray-50 rounded-xl">
                  <h4 class="text-xs font-bold text-black mb-2 flex items-center gap-2">
                    <app-icon name="Truck" size="14"></app-icon>
                    Shipping & Returns
                  </h4>
                  <p class="text-xs text-gray-500 leading-relaxed">{{ product.shippingAndReturns }}</p>
                </div>
              }
            </div>
          }

          <!-- Quantity & Confirm (Sticky at bottom of scrollable area) -->
          <div class="mt-auto pt-4 sm:pt-6 border-t border-gray-100">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 mb-2">
              <div class="flex items-center justify-between sm:flex-col sm:items-start gap-1">
                <span class="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400">Quantity</span>
                <div class="flex items-center gap-3">
                  <button 
                    (click)="decreaseQuantity()"
                    class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:text-black transition-colors"
                  >
                    <app-icon name="Minus" size="12"></app-icon>
                  </button>
                  <span class="w-6 text-center font-bold text-sm">{{ quantity }}</span>
                  <button 
                    (click)="increaseQuantity()"
                    class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:text-black transition-colors"
                  >
                    <app-icon name="Plus" size="12"></app-icon>
                  </button>
                </div>
              </div>
              
              <div class="flex-1">
                <button
                  (click)="confirm()"
                  [disabled]="availableSizes.length > 0 && !selectedSize"
                  class="w-full h-12 sm:h-14 bg-ds-accent text-white transition-all duration-300 hover:opacity-90 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 rounded-xl shadow-lg shadow-ds-accent/20 font-bold text-sm sm:text-base"
                >
                  <app-icon name="CheckCircle" size="16" class="sm:w-5 sm:h-5"></app-icon>
                  Update Selection
                </button>
              </div>
            </div>
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

  selectImage(url: string): void {
    this.selectedImage = url;
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 0) {
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
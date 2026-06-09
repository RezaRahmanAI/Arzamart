import { DecimalPipe } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { Product, ProductImage, ProductVariant } from "../../../core/models/product";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { PriceDisplayComponent } from "../price-display/price-display.component";
import { AppIconComponent } from "../app-icon/app-icon.component";
import { sortProductSizes } from "../../../core/constants/product.constants";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-quick-add-modal",
  standalone: true,
  imports: [PriceDisplayComponent, AppIconComponent, DecimalPipe],
  template: `
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        (click)="close.emit()"
      ></div>

      <!-- Modal Content -->
      <div
        class="relative w-full max-w-4xl bg-white shadow-[0_30px_100px_rgba(0,0,0,0.4)] overflow-hidden transform transition-all duration-500 ease-out max-h-[90vh] flex flex-col md:flex-row rounded-[2rem]"
      >
        <!-- Close Button -->
        <button
          (click)="close.emit()"
          class="absolute top-4 right-4 z-50 p-3 bg-white/80 backdrop-blur-lg rounded-full text-gray-500 hover:text-black hover:scale-110 active:scale-95 shadow-xl transition-all"
        >
          <app-icon name="X" size="24"></app-icon>
        </button>

        <!-- Left: Product Media Gallery -->
        <div class="w-full md:w-[45%] h-[40vh] md:h-auto bg-[#F9FAFB] flex-shrink-0 relative group border-b md:border-b-0 md:border-r border-gray-100">
          <div class="absolute inset-0 p-8 flex items-center justify-center">
            <img
              [src]="imageUrlService.getImageUrl(selectedImage || product.imageUrl || '')"
              [alt]="product.name"
              class="w-full h-full object-contain mix-blend-multiply transition-all duration-700 hover:scale-110"
            />
          </div>
          
          <!-- Image Dots -->
          @if (product.images.length > 1) {
            <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-white/50 backdrop-blur-sm p-2 rounded-full px-3">
              @for (img of product.images; track img.id; let i = $index) {
                <button type="button" (click)="selectImage(img.imageUrl)"
                        class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                        [style.backgroundColor]="(selectedImage || product.imageUrl) === img.imageUrl ? '#3B4FD8' : 'rgba(0,0,0,0.2)'"
                        [style.transform]="(selectedImage || product.imageUrl) === img.imageUrl ? 'scale(1.5)' : 'scale(1)'"></button>
              }
            </div>
          }

          <!-- Product Badges -->
          <div class="absolute top-6 left-6 flex flex-col gap-2">
            @if (product.isNew) {
                <span class="px-3 py-1 bg-[#3B4FD8] text-white text-[10px] font-bold rounded-full tracking-widest uppercase shadow-lg shadow-blue-500/20">New Arrival</span>
            }
            @if (originalPrice > currentPrice) {
                <span class="px-3 py-1 bg-[#E52222] text-white text-[10px] font-bold rounded-full tracking-widest uppercase shadow-lg shadow-red-500/20">
                    {{ ((originalPrice - currentPrice) / originalPrice * 100) | number:'1.0-0' }}% OFF
                </span>
            }
          </div>
        </div>

        <!-- Right: Selection Details (Scrollable) -->
        <div class="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto custom-scrollbar bg-white">
          
          <!-- Header: Title & Pricing -->
          <div class="mb-8">
            <h2 class="text-[10px] uppercase tracking-[0.3em] text-ds-primary font-bold mb-3">Product Specifications</h2>
            <h3 class="text-2xl md:text-3xl text-[#1A1A1A] font-bold mb-4 leading-tight">{{ product.name }}</h3>
            
            <div class="flex items-center flex-nowrap gap-4">
              <app-price-display
                [amount]="currentPrice"
                class="text-2xl md:text-3xl font-bold text-[#1A1A1A] whitespace-nowrap"
              ></app-price-display>
              @if (originalPrice > currentPrice) {
                <app-price-display
                  [amount]="originalPrice"
                  size="sm"
                  class="line-through text-gray-400 font-medium whitespace-nowrap"
                ></app-price-display>
              }
            </div>
          </div>

          <!-- Selection: Size -->
          @if (availableSizes.length > 0) {
            <div class="mb-10">
              <div class="flex items-center justify-between mb-4">
                <label class="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                  <app-icon name="Layers" size="14"></app-icon>
                  Select Size
                </label>
                @if (!selectedSize) {
                  <span class="text-[10px] text-red-500 font-bold animate-pulse">Required *</span>
                } @else {
                  <span class="text-[10px] text-green-500 font-bold flex items-center gap-1">
                    <app-icon name="Check" size="10"></app-icon>
                    {{ selectedSize }} Selected
                  </span>
                }
              </div>
              <div class="flex flex-wrap gap-3">
                @for (size of availableSizes; track size) {
                  <button
                    (click)="selectSize(size)"
                    class="min-w-[3.5rem] h-12 px-4 flex items-center justify-center border transition-all duration-500 rounded-xl text-sm font-bold"
                    [class.bg-[#1A1A1A]]="selectedSize === size"
                    [class.text-white]="selectedSize === size"
                    [class.border-[#1A1A1A]]="selectedSize === size"
                    [class.shadow-xl]="selectedSize === size"
                    [class.scale-105]="selectedSize === size"
                    [class.bg-white]="selectedSize !== size"
                    [class.text-gray-500]="selectedSize !== size"
                    [class.border-gray-100]="selectedSize !== size"
                    [class.hover:border-[#1A1A1A]]="selectedSize !== size"
                    [class.hover:text-[#1A1A1A]]="selectedSize !== size"
                  >
                    {{ size }}
                  </button>
                }
              </div>
            </div>
          }

          <!-- Content: Accordion System (Modern Dropdowns) -->
          <div class="space-y-2 mb-10">
            
            <!-- Description Section -->
            @if (product.description) {
              <div class="border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300"
                   [class.bg-gray-50]="openSections['description']">
                <button (click)="toggleSection('description')"
                        class="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
                  <span class="text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-3">
                    <app-icon name="FileText" size="16" class="text-gray-400"></app-icon>
                    Detailed Description
                  </span>
                  <app-icon [name]="openSections['description'] ? 'ChevronUp' : 'ChevronDown'" size="16" class="text-gray-300"></app-icon>
                </button>
                @if (openSections['description']) {
                  <div class="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                    <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                      {{ product.description }}
                    </p>
                  </div>
                }
              </div>
            }

            <!-- Fabric Section -->
            @if (product.fabricAndCare) {
              <div class="border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300"
                   [class.bg-gray-50]="openSections['fabric']">
                <button (click)="toggleSection('fabric')"
                        class="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
                  <span class="text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-3">
                    <app-icon name="Wind" size="16" class="text-gray-400"></app-icon>
                    Fabric & Quality
                  </span>
                  <app-icon [name]="openSections['fabric'] ? 'ChevronUp' : 'ChevronDown'" size="16" class="text-gray-300"></app-icon>
                </button>
                @if (openSections['fabric']) {
                  <div class="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                    <p class="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{{ product.fabricAndCare }}</p>
                  </div>
                }
              </div>
            }

            <!-- Shipping Section -->
            @if (product.shippingAndReturns) {
              <div class="border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300"
                   [class.bg-gray-50]="openSections['shipping']">
                <button (click)="toggleSection('shipping')"
                        class="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
                  <span class="text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-3">
                    <app-icon name="Truck" size="16" class="text-gray-400"></app-icon>
                    Delivery & Returns
                  </span>
                  <app-icon [name]="openSections['shipping'] ? 'ChevronUp' : 'ChevronDown'" size="16" class="text-gray-300"></app-icon>
                </button>
                @if (openSections['shipping']) {
                  <div class="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                    <p class="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{{ product.shippingAndReturns }}</p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Footer: Quantity & Action -->
          <div class="mt-auto pt-8 border-t border-gray-100">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
              <!-- Quantity Selector -->
              <div class="flex flex-col gap-2">
                <span class="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Quantity</span>
                <div class="flex items-center bg-gray-50 p-1 rounded-2xl border border-gray-100">
                  <button 
                    (click)="decreaseQuantity()"
                    class="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-black hover:shadow-md transition-all active:scale-90"
                  >
                    <app-icon name="Minus" size="14"></app-icon>
                  </button>
                  <span class="w-12 text-center font-bold text-[#1A1A1A]">{{ quantity }}</span>
                  <button 
                    (click)="increaseQuantity()"
                    class="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-black hover:shadow-md transition-all active:scale-90"
                  >
                    <app-icon name="Plus" size="14"></app-icon>
                  </button>
                </div>
              </div>
              
              <!-- Buy Button -->
              <div class="flex-1 pt-4 sm:pt-0">
                <button
                  (click)="confirm()"
                  class="w-full h-16 bg-[#3B4FD8] text-white transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 rounded-2xl shadow-[0_15px_30px_rgba(59,79,216,0.3)] font-bold text-base group"
                >
                  <app-icon name="CheckCircle" size="20" class="group-hover:animate-bounce"></app-icon>
                  Confirm Selection
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
  openSections: { [key: string]: boolean } = { description: false };

  toggleSection(section: string): void {
    this.openSections[section] = !this.openSections[section];
  }

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

  readonly notification = inject(NotificationService);

  confirm(): void {
    if (this.availableSizes.length > 0 && !this.selectedSize) {
      this.notification.warn("Please select a size first");
      return;
    }

    this.added.emit({
      size: this.selectedSize || undefined,
      quantity: this.quantity,
    });
  }
}
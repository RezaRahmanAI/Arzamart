import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { NgClass } from "@angular/common";
import { Product, ProductVariant } from "../../../core/models/product";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { AppIconComponent } from "../app-icon/app-icon.component";
import { sortProductSizes } from "../../../core/constants/product.constants";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-quick-add-modal",
  standalone: true,
  imports: [AppIconComponent, NgClass],
  template: `
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop overlay -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        (click)="close.emit()"
      ></div>

      <!-- Modal Card Container -->
      <div
        class="relative w-full max-w-sm bg-ds-bg shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300 ease-out p-6 flex flex-col gap-6"
      >
        <!-- Close Cross Button -->
        <button
          (click)="close.emit()"
          class="absolute top-4 right-4 text-ds-text-muted hover:text-ds-text transition-colors"
          aria-label="Close modal"
        >
          <app-icon name="X" size="18"></app-icon>
        </button>

        <!-- Title -->
        <div class="border-b border-ds-border pb-3">
          <h3 class="text-base font-bold text-ds-text text-center">Select Size & Quantity</h3>
        </div>

        <!-- Size Selection -->
        @if (availableSizes.length > 0) {
          <div class="flex flex-col gap-3">
            <span class="text-sm font-semibold text-ds-text">Size:</span>
            <div class="flex flex-wrap gap-2">
              @for (size of availableSizes; track size) {
                <button
                  (click)="selectSize(size)"
                  class="h-10 min-w-[3rem] px-3 flex items-center justify-center border font-bold text-sm transition-all duration-200 rounded-md"
                  [ngClass]="{
                    'border-ds-accent text-ds-accent bg-ds-info/10': selectedSize === size,
                    'border-ds-border text-ds-text bg-ds-bg hover:border-ds-text-muted': selectedSize !== size
                  }"
                >
                  {{ size }}
                </button>
              }
            </div>
          </div>
        }

        <!-- Quantity Selector -->
        <div class="flex flex-col gap-3">
          <span class="text-sm font-semibold text-ds-text">Quantity:</span>
          <div class="flex items-center gap-1 w-fit border border-ds-border rounded-md overflow-hidden bg-ds-bg">
            <button 
              (click)="decreaseQuantity()"
              class="w-10 h-10 flex items-center justify-center bg-ds-surface text-ds-text-secondary hover:bg-ds-surface-2 transition-all font-bold"
            >
              -
            </button>
            <span class="w-12 text-center font-bold text-ds-text">{{ quantity }}</span>
            <button 
              (click)="increaseQuantity()"
              class="w-10 h-10 flex items-center justify-center bg-ds-surface text-ds-text-secondary hover:bg-ds-surface-2 transition-all font-bold"
            >
              +
            </button>
          </div>
        </div>

        <!-- Action Button -->
        <button
          (click)="confirm()"
          class="w-full h-12 bg-ds-accent hover:bg-ds-accent-hover text-white font-bold rounded-lg shadow-md transition-all active:scale-[0.98] flex items-center justify-center text-sm"
        >
          {{ actionType === 'order' ? 'Order Now' : 'Add to Cart' }}
        </button>
      </div>
    </div>
  `,
})
export class QuickAddModalComponent {
  @Input({ required: true }) product!: Product;
  @Input() set initialSize(val: string | null) {
    if (val) this.selectedSize = val;
  }
  @Input() actionType: 'cart' | 'order' = 'cart';
  @Output() close = new EventEmitter<void>();
  @Output() added = new EventEmitter<{ size?: string; quantity: number }>();

  readonly imageUrlService = inject(ImageUrlService);
  readonly notification = inject(NotificationService);

  selectedSize: string | null = null;
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
import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule, FormsModule } from "@angular/forms";
import {
  InventoryService,
  ProductInventoryDto,
  VariantInventoryDto,
} from "../../services/inventory.service";
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from "rxjs";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { NotificationService } from "../../../core/services/notification.service";
import { ImageUrlService } from "../../../core/services/image-url.service";

@Component({
  selector: "app-admin-inventory",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AppIconComponent],
  templateUrl: "./admin-inventory.component.html",
})
export class AdminInventoryComponent implements OnInit, OnDestroy {

  private inventoryService = inject(InventoryService);
  private notification = inject(NotificationService);
  public imageUrlService = inject(ImageUrlService);
  private destroy$ = new Subject<void>();

  products: ProductInventoryDto[] = [];
  filteredProducts: ProductInventoryDto[] = [];
  searchControl = new FormControl("");

  // Modal state
  showStockModal = false;
  selectedProduct: ProductInventoryDto | null = null;
  newStockValue = 0;
  newPriceValue = 0;
  newComparePriceValue = 0;
  newPurchasePriceValue = 0;

  variantStockValues: number[] = [];
  variantPriceValues: number[] = [];
  variantComparePriceValues: number[] = [];
  variantPurchasePriceValues: number[] = [];
  
  isSaving = false;

  ngOnInit(): void {
    this.loadInventory();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.filterProducts(term);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInventory(): void {
    this.inventoryService.getInventory().subscribe((data) => {
      this.products = data;
      this.filterProducts(this.searchControl.value);
    });
  }

  filterProducts(term: string | null): void {
    if (!term) {
      this.filteredProducts = this.products;
      return;
    }

    const lowerTerm = term.toLowerCase();
    this.filteredProducts = this.products.filter(
      (p) =>
        p.productName.toLowerCase().includes(lowerTerm) ||
        p.productSku.toLowerCase().includes(lowerTerm),
    );
  }



  openStockModal(product: ProductInventoryDto) {
    this.selectedProduct = product;
    this.newStockValue = product.stockQuantity;
    this.newPriceValue = product.price || 0;
    this.newComparePriceValue = product.compareAtPrice || 0;
    this.newPurchasePriceValue = product.purchaseRate || 0;

    if (product.variants && product.variants.length > 0) {
      this.variantStockValues = product.variants.map(v => v.stockQuantity);
      this.variantPriceValues = product.variants.map(v => v.price || 0);
      this.variantComparePriceValues = product.variants.map(v => v.compareAtPrice || 0);
      this.variantPurchasePriceValues = product.variants.map(v => v.purchaseRate || 0);
    } else {
      this.variantStockValues = [];
      this.variantPriceValues = [];
      this.variantComparePriceValues = [];
      this.variantPurchasePriceValues = [];
    }
    
    this.showStockModal = true;
  }

  closeStockModal() {
    this.showStockModal = false;
    this.selectedProduct = null;
    this.variantStockValues = [];
    this.variantPriceValues = [];
    this.variantComparePriceValues = [];
    this.variantPurchasePriceValues = [];
  }

  adjustStock(amount: number) {
    const newValue = this.newStockValue + amount;
    if (newValue >= 0) {
      this.newStockValue = newValue;
    }
  }

  adjustVariantStock(index: number, amount: number) {
    const newValue = this.variantStockValues[index] + amount;
    if (newValue >= 0) {
      this.variantStockValues[index] = newValue;
    }
  }

  onVariantStockChange(index: number) {
    if (this.variantStockValues[index] < 0) {
      this.variantStockValues[index] = 0;
    }
  }

  saveStock() {
    if (!this.selectedProduct) return;
    
    this.isSaving = true;

    // If product has variants, save each variant stock and prices
    if (this.selectedProduct.variants && this.selectedProduct.variants.length > 0) {
      const updateRequests = this.selectedProduct.variants.map((variant, index) => {
        return this.inventoryService.updateVariantStock(variant.variantId, {
          quantity: this.variantStockValues[index],
          price: this.variantPriceValues[index],
          compareAtPrice: this.variantComparePriceValues[index],
          purchaseRate: this.variantPurchasePriceValues[index]
        });
      });

      // Execute all updates
      let completed = 0;
      updateRequests.forEach((request, index) => {
        request.subscribe({
          next: () => {
            this.selectedProduct!.variants![index].stockQuantity = this.variantStockValues[index];
            this.selectedProduct!.variants![index].price = this.variantPriceValues[index];
            this.selectedProduct!.variants![index].compareAtPrice = this.variantComparePriceValues[index];
            this.selectedProduct!.variants![index].purchaseRate = this.variantPurchasePriceValues[index];
            
            completed++;
            if (completed === updateRequests.length) {
              this.loadInventory();
              this.notification.success('Inventory updated successfully');
              this.closeStockModal();
              this.isSaving = false;
            }
          },
          error: (err) => {
            this.notification.error(err.error?.message || "Failed to update inventory");
            this.isSaving = false;
          },
        });
      });
    } else {
      // No variants - update product stock and prices directly
      this.inventoryService.updateStock(this.selectedProduct.productId, {
        quantity: this.newStockValue,
        price: this.newPriceValue,
        compareAtPrice: this.newComparePriceValue,
        purchaseRate: this.newPurchasePriceValue
      }).subscribe({
        next: () => {
          this.selectedProduct!.stockQuantity = this.newStockValue;
          this.selectedProduct!.totalStock = this.newStockValue;
          this.selectedProduct!.price = this.newPriceValue;
          this.selectedProduct!.compareAtPrice = this.newComparePriceValue;
          this.selectedProduct!.purchaseRate = this.newPurchasePriceValue;
          
          this.loadInventory();
          this.notification.success('Inventory updated successfully');
          this.closeStockModal();
          this.isSaving = false;
        },
        error: (err) => {
          this.notification.error(err.error?.message || "Failed to update inventory");
          this.isSaving = false;
        },
      });
    }
  }
}

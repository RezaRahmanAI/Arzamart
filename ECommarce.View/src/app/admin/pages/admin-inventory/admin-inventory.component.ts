import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  InventoryService,
  ProductInventoryDto,
  VariantInventoryDto,
} from "../../services/inventory.service";
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from "rxjs";
import {
  LucideAngularModule,
  Search,
  Package,
  Box,
  Warehouse,
  AlertCircle,
} from "lucide-angular";

@Component({
  selector: "app-admin-inventory",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: "./admin-inventory.component.html",
})
export class AdminInventoryComponent implements OnInit, OnDestroy {
  readonly icons = {
    Search,
    Package,
    Box,
    Warehouse,
    AlertCircle,
  };
  private inventoryService = inject(InventoryService);
  private destroy$ = new Subject<void>();

  products: ProductInventoryDto[] = [];
  filteredProducts: ProductInventoryDto[] = [];
  searchControl = new FormControl("");

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

  updateStock(variant: VariantInventoryDto, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);

    if (isNaN(newQuantity) || newQuantity < 0) {
      input.value = variant.stockQuantity.toString(); // Revert
      return;
    }

    this.inventoryService
      .updateStock(variant.variantId, newQuantity)
      .subscribe({
        next: (res) => {
          variant.stockQuantity = newQuantity;
          // Ideally update total stock in UI locally or reload
          const product = this.products.find(
            (p) =>
              p.productId ===
              this.products.find((p) => p.variants.includes(variant))
                ?.productId,
          );
          if (product) {
            product.totalStock = res.newTotal;
          }
        },
        error: () => {
          input.value = variant.stockQuantity.toString(); // Revert on error
          alert("Failed to update stock");
        },
      });
  }
}

import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs";

import {
  AdminProduct,
  ProductsQueryParams,
  ProductsStatusTab,
} from "../../models/products.models";
import { ProductsService } from "../../services/products.service";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";
import {
  LucideAngularModule,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileUp,
  ChevronDown,
  AlertTriangle,
  Rocket,
} from "lucide-angular";

@Component({
  selector: "app-admin-products",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./admin-products.component.html",
})
export class AdminProductsComponent implements OnInit, OnDestroy {
  readonly icons = {
    Plus,
    Search,
    Filter,
    Download,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    FileUp,
    ChevronDown,
    AlertTriangle,
    Rocket,
  };
  private productsService = inject(ProductsService);
  readonly imageUrlService = inject(ImageUrlService);
  private destroy$ = new Subject<void>();

  isLoading = false;
  searchControl = new FormControl("", { nonNullable: true });
  categoryControl = new FormControl("All Categories", { nonNullable: true });

  statusTabs: ProductsStatusTab[] = [
    "All Items",
    "Active",
    "Drafts",
    "Archived",
  ];
  selectedStatusTab: ProductsStatusTab = "All Items";

  categories = ["All Categories", "Women", "Men", "Kids", "Accessories"];

  products: AdminProduct[] = [];
  totalResults = 0;
  page = 1;
  pageSize = 10;

  selectedProductIds = new Set<number>();

  ngOnInit(): void {
    this.loadProducts();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadProducts();
      });

    this.categoryControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadProducts();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setStatusTab(tab: ProductsStatusTab): void {
    if (this.selectedStatusTab === tab) {
      return;
    }
    this.selectedStatusTab = tab;
    this.page = 1;
    this.loadProducts();
  }

  toggleSelectAll(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.products.forEach((product) =>
        this.selectedProductIds.add(product.id),
      );
    } else {
      this.products.forEach((product) =>
        this.selectedProductIds.delete(product.id),
      );
    }
  }

  toggleSelectProduct(productId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.selectedProductIds.add(productId);
    } else {
      this.selectedProductIds.delete(productId);
    }
  }

  deleteProduct(product: AdminProduct): void {
    const confirmed = window.confirm(`Delete ${product.name}?`);
    if (!confirmed) {
      return;
    }
    this.productsService.deleteProduct(product.id).subscribe((success) => {
      if (!success) {
        return;
      }
      this.selectedProductIds.delete(product.id);
      this.loadProducts();
    });
  }

  exportProducts(): void {
    this.productsService
      .exportProducts(this.buildQueryParams())
      .subscribe((csv) => {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "products.csv";
        anchor.click();
        URL.revokeObjectURL(url);
      });
  }

  previousPage(): void {
    if (this.page === 1) {
      return;
    }
    this.page -= 1;
    this.loadProducts();
  }

  nextPage(): void {
    if (this.page >= this.totalPages) {
      return;
    }
    this.page += 1;
    this.loadProducts();
  }

  setPage(page: number | "ellipsis"): void {
    if (
      page === "ellipsis" ||
      page === this.page ||
      page < 1 ||
      page > this.totalPages
    ) {
      return;
    }
    this.page = page;
    this.loadProducts();
  }

  get paginationItems(): Array<number | "ellipsis"> {
    if (this.totalPages <= 5) {
      return Array.from({ length: this.totalPages }, (_, index) => index + 1);
    }

    const items: Array<number | "ellipsis"> = [];
    const start = Math.max(2, this.page - 1);
    const end = Math.min(this.totalPages - 1, this.page + 1);

    items.push(1);

    if (start > 2) {
      items.push("ellipsis");
    }

    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }

    if (end < this.totalPages - 1) {
      items.push("ellipsis");
    }

    items.push(this.totalPages);

    return items;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalResults / this.pageSize));
  }

  get pageStart(): number {
    if (this.totalResults === 0) {
      return 0;
    }
    return (this.page - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalResults);
  }

  get isAllSelected(): boolean {
    return (
      this.products.length > 0 &&
      this.products.every((product) => this.selectedProductIds.has(product.id))
    );
  }

  get isIndeterminate(): boolean {
    return (
      this.products.some((product) =>
        this.selectedProductIds.has(product.id),
      ) && !this.isAllSelected
    );
  }

  isSelected(productId: number): boolean {
    return this.selectedProductIds.has(productId);
  }

  isOutOfStock(product: AdminProduct): boolean {
    return product.stockQuantity === 0 || product.status === "Out of Stock";
  }

  isLowStock(product: AdminProduct): boolean {
    return product.stockQuantity > 0 && product.stockQuantity <= 5;
  }

  statusClasses(product: AdminProduct): string {
    switch (product.status) {
      case "Active":
        return "bg-accent text-primary";
      case "Draft":
        return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
      case "Archived":
        return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
      case "Out of Stock":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
    }
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.productsService.getProducts(this.buildQueryParams()).subscribe({
      next: ({ items, total }) => {
        const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
        if (total > 0 && this.page > totalPages) {
          this.page = totalPages;
          this.loadProducts();
          return;
        }
        this.products = items;
        this.totalResults = total;
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  private buildQueryParams(): ProductsQueryParams {
    const statusTab =
      this.selectedStatusTab === "All Items" ? "all" : this.selectedStatusTab;
    const category =
      this.categoryControl.value === "All Categories"
        ? "all"
        : this.categoryControl.value;

    return {
      searchTerm: this.searchControl.value,
      category,
      statusTab,
      page: this.page,
      pageSize: this.pageSize,
    };
  }
}

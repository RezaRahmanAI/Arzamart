import { NgIf, NgClass, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs";

import {
  AdminProduct,
  ProductsQueryParams,
  ProductsStatusTab,
} from "../../../core/models/product";
import { ProductsService } from "../../services/products.service";
import { SubCategoriesService } from "../../services/sub-categories.service";
import { CategoriesService } from "../../services/categories.service";
import { Category, SubCategory } from "../../../core/models/category";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-admin-products",
  standalone: true,
  imports: [NgIf, NgClass, ReactiveFormsModule, RouterModule, PriceDisplayComponent, AppIconComponent, NgFor],
  templateUrl: "./products.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit, OnDestroy {
  private productsService = inject(ProductsService);
  private subCategoriesService = inject(SubCategoriesService);
  private categoriesService = inject(CategoriesService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  readonly imageUrlService = inject(ImageUrlService);
  readonly authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  pageTitle = "Products";

  isLoading = false;
  searchControl = new FormControl("", { nonNullable: true });
  categoryControl = new FormControl("All Categories", { nonNullable: true });
  subCategoryControl = new FormControl("All Subcategories", { nonNullable: true });
  statusControl = new FormControl("All Items", { nonNullable: true });

  statusTabs: ProductsStatusTab[] = [
    "All Items",
    "Active",
    "Drafts",
    "Archived",
  ];
  selectedStatusTab: ProductsStatusTab = "All Items";

  categories: string[] = ["All Categories"];
  allCategories: Category[] = [];
  allSubCategories: SubCategory[] = [];
  filteredSubCategories: SubCategory[] = [];

  products: AdminProduct[] = [];
  totalResults = 0;
  page = 1;
  pageSize = 10;

  selectedProductIds = new Set<number>();

  ngOnInit(): void {
    this.pageTitle = "Products";

    this.categoriesService.getAll().pipe(takeUntil(this.destroy$)).subscribe((cats) => {
      this.allCategories = cats.filter(c => c.isActive);
      this.categories = ["All Categories", ...this.allCategories.map(c => c.name)];
      this.cdr.markForCheck();
    });

    this.subCategoriesService.getAll().pipe(takeUntil(this.destroy$)).subscribe((subs) => {
      this.allSubCategories = subs.filter(s => s.isActive);
      this.updateFilteredSubCategories();
    });

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
        this.subCategoryControl.setValue("All Subcategories", { emitEvent: false });
        this.updateFilteredSubCategories();
        this.page = 1;
        this.loadProducts();
      });

    this.subCategoryControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadProducts();
      });

    this.statusControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.selectedStatusTab = val as ProductsStatusTab;
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
    this.productsService.deleteProduct(product.id).subscribe({
      next: (success) => {
        if (!success) {
          this.cdr.markForCheck();
          return;
        }
        this.selectedProductIds.delete(product.id);
        
        this.products = this.products.filter(p => p.id !== product.id);
        this.totalResults--;
        
        this.loadProducts();
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
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
    return (product.stockQuantity ?? 0) === 0 || product.status === "Out of Stock";
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
    this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private buildQueryParams(): ProductsQueryParams {
    const statusTab =
      this.selectedStatusTab === "All Items" ? "all" : this.selectedStatusTab;
    const category =
      this.categoryControl.value === "All Categories"
        ? "all"
        : this.categoryControl.value;
    const subCategory =
      this.subCategoryControl.value === "All Subcategories"
        ? "all"
        : this.subCategoryControl.value;

    return {
      searchTerm: this.searchControl.value,
      category,
      subCategory,
      statusTab,
      page: this.page,
      pageSize: this.pageSize,
    };
  }

  private updateFilteredSubCategories(): void {
    const selectedCatName = this.categoryControl.value;
    if (selectedCatName === "All Categories") {
      this.filteredSubCategories = this.allSubCategories;
    } else {
      const selectedCat = this.allCategories.find(c => c.name === selectedCatName);
      if (selectedCat) {
        this.filteredSubCategories = this.allSubCategories.filter(
          (s) => s.categoryId === selectedCat.id
        );
      } else {
        this.filteredSubCategories = [];
      }
    }
  }
}


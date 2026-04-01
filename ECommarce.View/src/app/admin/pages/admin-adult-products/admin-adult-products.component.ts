import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs";
import { AdultProduct } from "../../models/adult-product.models";
import { AdultProductService } from "../../../features/adult-landing/services/adult-product.service";
import { ImageUrlService } from "../../../core/services/image-url.service";
import {
  LucideAngularModule,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  Eye,
} from "lucide-angular";

@Component({
  selector: "app-admin-adult-products",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./admin-adult-products.component.html",
})
export class AdminAdultProductsComponent implements OnInit, OnDestroy {
  readonly icons = {
    Plus,
    Search,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Package,
    Eye,
  };
  
  private adultProductService = inject(AdultProductService);
  readonly imageUrlService = inject(ImageUrlService);
  private destroy$ = new Subject<void>();

  isLoading = false;
  searchControl = new FormControl("", { nonNullable: true });
  
  allProducts: AdultProduct[] = [];
  filteredProducts: AdultProduct[] = [];
  
  ngOnInit(): void {
    this.loadProducts();

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

  loadProducts(): void {
    this.isLoading = true;
    this.adultProductService.getAll().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.filterProducts(this.searchControl.value);
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  filterProducts(term: string): void {
    if (!term) {
      this.filteredProducts = [...this.allProducts];
    } else {
      const lowTerm = term.toLowerCase();
      this.filteredProducts = this.allProducts.filter(p => 
        p.headline.toLowerCase().includes(lowTerm) || 
        p.subtitle?.toLowerCase().includes(lowTerm)
      );
    }
  }

  deleteProduct(product: AdultProduct): void {
    const confirmed = window.confirm(`Delete ${product.headline}?`);
    if (!confirmed) {
      return;
    }
    this.adultProductService.delete(product.id).subscribe(() => {
      this.allProducts = this.allProducts.filter(p => p.id !== product.id);
      this.filterProducts(this.searchControl.value);
    });
  }
}

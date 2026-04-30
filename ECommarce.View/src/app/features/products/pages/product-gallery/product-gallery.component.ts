import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { combineLatest } from "rxjs";
import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";
import { ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";
import { CategoryService } from "../../../../core/services/category.service";
import { Category } from "../../../../core/models/category";
import { Router, RouterModule } from "@angular/router";

@Component({
  selector: "app-product-gallery",
  standalone: true,
  imports: [CommonModule, ProductCardComponent, AppIconComponent, RouterModule],
  templateUrl: "./product-gallery.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGalleryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  subCategories: any[] = [];
  
  // New Hierarchical Sidebar State for Offers
  offerCategories: any[] = [];
  isOffersPage = false;

  selectedSize: string = 'All Sizes';
  allSizes = ['All Sizes', 'S', 'M', 'L', 'XL', 'XXL'];

  activeSubSlug: string | null = null;
  parentCategoryName: string | null = null;
  parentCategorySlug: string | null = null;

  constructor() {
    combineLatest([this.route.params, this.route.queryParams])
      .pipe(takeUntilDestroyed())
      .subscribe(([params, queryParams]) => {
        this.loadProducts({ ...params, ...queryParams });
      });
  }

  loading = true;
  title = "Products";
  skeletonItems = Array(8).fill(0);
  
  // For virtual scrolling rows in a grid (e.g. 4 columns)
  productRows: Product[][] = [];
  readonly itemsPerRow = 5;

  ngOnInit(): void {
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  private loadProducts(params: any): void {
    this.loading = true;
    const { categorySlug, subCategorySlug, collectionSlug, slug } = params;
    // Query params for tier and tags are usually in queryParams, not route params,
    // but the current implementation uses route params for slugs.
    // We should check queryParams for filters like tier and tags.
    // However, the method signature takes `params` which seems to come from `route.params`.
    // Let's modify ngOnInit to combine params and queryParams.

    // Changing implementation to look at queryParams as well
    const queryParams = this.route.snapshot.queryParams;
    const tier = queryParams["tier"];
    const tags = queryParams["tags"];

    const filterParams: any = {};
    if (tier) filterParams.tier = tier;
    if (tags) filterParams.tags = tags;

    // Determine title based on what slug we have
    if (this.route.snapshot.url[0]?.path === "search") {
      const searchTerm = queryParams["searchTerm"];
      if (searchTerm) {
        filterParams.searchTerm = searchTerm;
        this.title = `Search Results for "${searchTerm}"`;
      } else {
        this.title = "Search Products";
      }
    } else if (
      categorySlug ||
      (this.route.snapshot.url[0]?.path === "category" && slug)
    ) {
      filterParams.categorySlug = categorySlug || slug;
      this.title = (categorySlug || slug).replace(/-/g, " ");
    } else if (
      subCategorySlug ||
      (this.route.snapshot.url[0]?.path === "subcategory" && slug)
    ) {
      filterParams.subCategorySlug = subCategorySlug || slug;
      this.title = (subCategorySlug || slug).replace(/-/g, " ");
    } else if (this.route.snapshot.url[0]?.path === "offers") {
      filterParams.isFeatured = true;
      this.isOffersPage = true;
      this.title = "Offer Products";
    } else if (
      collectionSlug ||
      (this.route.snapshot.url[0]?.path === "collection" && slug)
    ) {
      filterParams.collectionSlug = collectionSlug || slug;
      this.title = (collectionSlug || slug).replace(/-/g, " ");
    }

    this.productService.getProducts(filterParams).subscribe({
      next: (response) => {
        this.products = response.data;
        this.filteredProducts = response.data;
        this.loading = false;
        
        if (this.isOffersPage) {
          this.buildOfferHierarchy();
        }
        
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });

    // Load Category and Subcategories for Sidebar
    const isCategoryRoute = categorySlug || (this.route.snapshot.url[0]?.path === "category" && slug);
    const isSubCategoryRoute = subCategorySlug || (this.route.snapshot.url[0]?.path === "subcategory" && slug);
    const currentSlug = categorySlug || subCategorySlug || slug;

    this.activeSubSlug = isSubCategoryRoute ? currentSlug : null;

    this.categoryService.getCategories().subscribe(categories => {
      let currentCat: Category | undefined;

      if (isCategoryRoute) {
        currentCat = categories.find(c => c.slug === currentSlug);
      } else if (isSubCategoryRoute) {
        // Find parent category that contains this subcategory
        currentCat = categories.find(c => 
          c.subCategories?.some((sub: any) => sub.slug === currentSlug)
        );
      }

      if (currentCat) {
        this.subCategories = currentCat.subCategories || [];
        this.parentCategoryName = currentCat.name;
        this.parentCategorySlug = currentCat.slug;
        
        // If we are on a subcategory page, the title should be more specific
        if (isSubCategoryRoute) {
          const sub = currentCat.subCategories?.find((s: any) => s.slug === currentSlug);
          if (sub) {
            this.title = sub.name;
          }
        }
      } else {
        this.subCategories = [];
        this.parentCategoryName = null;
        this.parentCategorySlug = null;
      }
      this.cdr.markForCheck();
    });
  }

  selectSizeFilter(size: string): void {
    this.selectedSize = size;
    if (size === 'All Sizes') {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(product => {
        return product.variants?.some(v => v.size?.toUpperCase() === size);
      });
    }
    this.cdr.markForCheck();
  }

  navigateToSub(href: string): void {
    this.router.navigateByUrl(href);
  }

  private buildOfferHierarchy(): void {
    if (this.products.length === 0) return;

    this.categoryService.getCategories().subscribe(categories => {
      const hierarchy: any[] = [];
      const productCategories = new Set(this.products.map(p => String(p.categoryId)));
      const productSubCategories = new Set(this.products.map(p => String(p.subCategoryId)));

      categories.forEach(cat => {
        const catId = String(cat.id);
        if (productCategories.has(catId)) {
          const catSubCols = cat.subCategories?.filter((sub: any) => productSubCategories.has(String(sub.id))) || [];
          if (catSubCols.length > 0 || productCategories.has(catId)) {
             hierarchy.push({
               ...cat,
               subCategories: catSubCols
             });
          }
        }
      });
      this.offerCategories = hierarchy;
      this.cdr.markForCheck();
    });
  }

  private chunkProductsIntoRows(): void {
    const rows: Product[][] = [];
    for (let i = 0; i < this.products.length; i += this.itemsPerRow) {
      rows.push(this.products.slice(i, i + this.itemsPerRow));
    }
    this.productRows = rows;
  }
}

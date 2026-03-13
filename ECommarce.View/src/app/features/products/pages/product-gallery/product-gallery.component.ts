import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { ActivatedRoute } from "@angular/router";
import { combineLatest } from "rxjs";
import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";
import { ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { LucideAngularModule, Package } from "lucide-angular";

@Component({
  selector: "app-product-gallery",
  standalone: true,
  imports: [CommonModule, ProductCardComponent, LucideAngularModule, ScrollingModule],
  templateUrl: "./product-gallery.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGalleryComponent implements OnInit {
  readonly icons = {
    Package,
  };
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    combineLatest([this.route.params, this.route.queryParams])
      .pipe(takeUntilDestroyed())
      .subscribe(([params, queryParams]) => {
        this.loadProducts({ ...params, ...queryParams });
      });
  }

  products: Product[] = [];
  loading = true;
  title = "Products";
  skeletonItems = Array(8).fill(0);
  
  // For virtual scrolling rows in a grid (e.g. 4 columns)
  productRows: Product[][] = [];
  readonly itemsPerRow = 4;

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
        this.chunkProductsIntoRows();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
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

import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { combineLatest } from "rxjs";
import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";

import { LucideAngularModule, Package } from "lucide-angular";

@Component({
  selector: "app-product-gallery",
  standalone: true,
  imports: [CommonModule, ProductCardComponent, LucideAngularModule],
  templateUrl: "./product-gallery.component.html",
})
export class ProductGalleryComponent implements OnInit {
  readonly icons = {
    Package,
  };
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  products: Product[] = [];
  loading = true;
  title = "Products";
  skeletonItems = Array(8).fill(0);

  ngOnInit(): void {
    combineLatest([this.route.params, this.route.queryParams]).subscribe(
      ([params, queryParams]) => {
        this.loadProducts({ ...params, ...queryParams });
      },
    );
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
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}

import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";

import { MenBreadcrumbsComponent } from "../../components/breadcrumbs/breadcrumbs.component";
import { MenCategoryChipsComponent } from "../../components/category-chips/category-chips.component";
import { MenFiltersSortbarComponent } from "../../components/filters-sortbar/filters-sortbar.component";
import { MenProductGridComponent } from "../../components/product-grid/product-grid.component";
import { MenPaginationComponent } from "../../components/pagination/pagination.component";
import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";

@Component({
  selector: "app-men-products-page",
  standalone: true,
  imports: [
    CommonModule,
    MenBreadcrumbsComponent,
    MenCategoryChipsComponent,
    MenFiltersSortbarComponent,
    MenProductGridComponent,
    MenPaginationComponent,
  ],
  templateUrl: "./men-products-page.component.html",
  styleUrl: "./men-products-page.component.css",
})
export class MenProductsPageComponent implements OnInit {
  products: Product[] = [];

  constructor(private readonly productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getProducts({ gender: "men" }).subscribe((response) => {
      this.products = response.data;
    });
  }
}

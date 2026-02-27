import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpContext } from "@angular/common/http";

import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";
import { SHOW_LOADING } from "../../../../core/services/loading.service";

@Component({
  selector: "app-featured-products",
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: "./featured-products.component.html",
  styleUrl: "./featured-products.component.css",
})
export class FeaturedProductsComponent implements OnInit {
  products: Product[] = [];

  constructor(private readonly productService: ProductService) {}

  ngOnInit(): void {
    this.productService
      .getFeaturedProducts(10, new HttpContext().set(SHOW_LOADING, true))
      .subscribe((response) => {
        this.products = response.data;
      });
  }
}

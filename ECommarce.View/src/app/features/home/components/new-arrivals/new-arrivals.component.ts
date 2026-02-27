import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpContext } from "@angular/common/http";

import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";
import { SHOW_LOADING } from "../../../../core/services/loading.service";

@Component({
  selector: "app-new-arrivals",
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: "./new-arrivals.component.html",
  styleUrl: "./new-arrivals.component.css",
})
export class NewArrivalsComponent implements OnInit {
  products: Product[] = [];

  constructor(private readonly productService: ProductService) {}

  ngOnInit(): void {
    this.productService
      .getNewArrivals(10, new HttpContext().set(SHOW_LOADING, true))
      .subscribe((response) => {
        this.products = response.data;
      });
  }
}

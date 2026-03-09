import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { HttpContext } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";
import { SHOW_LOADING } from "../../../../core/services/loading.service";

import { ImageUrlService } from "../../../../core/services/image-url.service";

@Component({
  selector: "app-women-product-grid",
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: "./product-grid.component.html",
  styleUrl: "./product-grid.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WomenProductGridComponent implements OnInit {
  products$!: Observable<Product[]>;

  constructor(
    private readonly productService: ProductService,
    readonly imageUrlService: ImageUrlService,
  ) {}

  ngOnInit(): void {
    this.products$ = this.productService
      .getProducts(
        { gender: "women" },
        new HttpContext().set(SHOW_LOADING, true),
      )
      .pipe(map(res => res.data));
  }

  trackByProduct(index: number, product: Product): number {
    return product.id;
  }
}

import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { HttpContext } from "@angular/common/http";

import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { SHOW_LOADING } from "../../../../core/services/loading.service";

import { ImageUrlService } from "../../../../core/services/image-url.service";

import {
  LucideAngularModule,
  LayoutGrid,
  Filter,
  Shirt,
  Trophy,
  Gem,
  ShoppingBag,
  Sliders,
  ChevronDown,
  Package,
  Heart,
  ShoppingCart,
} from "lucide-angular";

@Component({
  selector: "app-accessories-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./accessories-page.component.html",
  styleUrl: "./accessories-page.component.css",
})
export class AccessoriesPageComponent implements OnInit {
  readonly icons: any = {
    LayoutGrid,
    Filter,
    Shirt,
    Trophy,
    Gem,
    ShoppingBag,
    Sliders,
    ChevronDown,
    Package,
    Heart,
    ShoppingCart,
  };
  products: Product[] = [];

  constructor(
    private readonly productService: ProductService,
    readonly imageUrlService: ImageUrlService,
  ) {}

  ngOnInit(): void {
    this.productService
      .getProducts(
        { category: "Accessories" },
        new HttpContext().set(SHOW_LOADING, true),
      )
      .subscribe((res) => {
        this.products = res.data;
      });
  }
}

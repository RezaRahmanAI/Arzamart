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
  ChevronRight,
  ChevronLeft,
  Sliders,
  Package,
  HelpCircle,
  Heart,
  ShoppingCart,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-angular";

@Component({
  selector: "app-children-products-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./children-products-page.component.html",
  styleUrl: "./children-products-page.component.css",
})
export class ChildrenProductsPageComponent implements OnInit {
  readonly icons = {
    ChevronRight,
    ChevronLeft,
    Sliders,
    Package,
    HelpCircle,
    Heart,
    ShoppingCart,
    Mail,
    ChevronDown,
    ChevronUp,
  };
  products: Product[] = [];

  constructor(
    private readonly productService: ProductService,
    readonly imageUrlService: ImageUrlService,
  ) {}

  ngOnInit(): void {
    this.productService
      .getProducts(
        { gender: "kids" },
        new HttpContext().set(SHOW_LOADING, true),
      )
      .subscribe((res) => {
        this.products = res.data;
      });
  }
}

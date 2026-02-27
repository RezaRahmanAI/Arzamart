import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { combineLatest, map } from "rxjs";

import { CartService } from "../../../../core/services/cart.service";
import { ProductService } from "../../../../core/services/product.service";
import { CartItem } from "../../../../core/models/cart";
import { Product } from "../../../../core/models/product";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../../core/services/image-url.service";

import {
  LucideAngularModule,
  Trash2,
  Minus,
  Plus,
  Lock,
  Tag,
  ChevronDown,
} from "lucide-angular";

@Component({
  selector: "app-cart-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./cart-page.component.html",
  styleUrl: "./cart-page.component.css",
})
export class CartPageComponent {
  readonly icons = {
    Trash2,
    Minus,
    Plus,
    Lock,
    Tag,
    ChevronDown,
  };
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  readonly imageUrlService = inject(ImageUrlService);

  readonly vm$ = combineLatest([
    this.cartService.getCart(),
    this.cartService.summary$,
  ]).pipe(map(([cartItems, summary]) => ({ cartItems, summary })));

  readonly recommendedProducts$ = this.productService
    .getFeaturedProducts()
    .pipe(map((res) => res.data));

  increaseQuantity(item: CartItem): void {
    this.cartService.updateQty(item.id, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem): void {
    this.cartService.updateQty(item.id, item.quantity - 1);
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.id);
  }

  trackCartItem(_: number, item: CartItem): string {
    return item.id;
  }

  trackProduct(_: number, product: Product): number {
    return product.id;
  }
}

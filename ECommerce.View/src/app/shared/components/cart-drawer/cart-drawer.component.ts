import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { AsyncPipe, DecimalPipe } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { combineLatest, map } from "rxjs";

import { CartService } from "../../../core/services/cart.service";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { AppIconComponent } from "../app-icon/app-icon.component";
import { CartItem } from "../../../core/models/cart";

@Component({
  selector: "app-cart-drawer",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DecimalPipe, RouterModule, AppIconComponent],
  templateUrl: "./cart-drawer.component.html",
  styleUrl: "./cart-drawer.component.css",
})
export class CartDrawerComponent {
  public readonly cartService = inject(CartService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly router = inject(Router);

  readonly isOpen$ = this.cartService.isDrawerOpen$;

  readonly vm$ = combineLatest([
    this.cartService.getCart(),
    this.cartService.summary$,
  ]).pipe(
    map(([cartItems, summary]) => ({ cartItems, summary }))
  );

  close(): void {
    this.cartService.closeDrawer();
  }

  increaseQty(item: CartItem): void {
    this.cartService.updateQty(item.id, item.quantity + 1);
  }

  decreaseQty(item: CartItem): void {
    this.cartService.updateQty(item.id, item.quantity - 1);
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.id);
  }

  checkout(): void {
    this.close();
    this.router.navigate(["/checkout"]);
  }
}

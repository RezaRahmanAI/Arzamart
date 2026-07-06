import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import { AsyncPipe, DecimalPipe } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { combineLatest, map } from "rxjs";
import {
  animate,
  style,
  transition,
  trigger,
  state,
} from "@angular/animations";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

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
  animations: [
    trigger("slideOutLeft", [
      transition(":leave", [
        animate(
          "300ms ease-out",
          style({ transform: "translateX(-100%)", opacity: 0, height: 0, marginBottom: 0, padding: 0 }),
        ),
      ]),
    ]),
  ],
})
export class CartDrawerComponent implements OnInit, OnDestroy {
  public readonly cartService = inject(CartService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isOpen$ = this.cartService.isDrawerOpen$;
  removingIds = new Set<string>();
  slidingOutIds = new Set<string>();

  readonly vm$ = combineLatest([
    this.cartService.getCart(),
    this.cartService.summary$,
  ]).pipe(
    map(([cartItems, summary]) => ({ cartItems, summary }))
  );

  constructor() {
    this.cartService.removingIds$
      .pipe(takeUntilDestroyed())
      .subscribe((ids) => {
        this.removingIds = ids;
        this.cdr.markForCheck();
      });

    this.cartService.slidingOutIds$
      .pipe(takeUntilDestroyed())
      .subscribe((ids) => {
        this.slidingOutIds = ids;
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

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

  isRemoving(itemId: string): boolean {
    return this.removingIds.has(itemId);
  }

  checkout(): void {
    this.close();
    this.router.navigate(["/checkout"]);
  }
}

import { AsyncPipe, DatePipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { combineLatest, map } from "rxjs";

import { AuthService } from "../../../../core/services/auth.service";
import { OrderService } from "../../../../core/services/order.service";
import { Order } from "../../../../core/models/order";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";

@Component({
  selector: "app-orders-page",
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterModule, PriceDisplayComponent],
  templateUrl: "./orders-page.component.html",
  styleUrl: "./orders-page.component.css",
})
export class OrdersPageComponent {
  private readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);

  readonly orders$ = combineLatest([
    this.authService.currentUser,
    this.orderService.orders$,
  ]).pipe(map(([user, orders]) => (user ? orders : ([] as Order[]))));

  trackByOrder(_: number, order: Order): number {
    return order.id;
  }
}

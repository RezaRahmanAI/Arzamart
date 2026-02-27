import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { combineLatest, map } from "rxjs";

import { OrderService } from "../../../../core/services/order.service";
import { Order, OrderItem, OrderStatus } from "../../../../core/models/order";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../../core/services/image-url.service";

import { AnalyticsService } from "../../../../core/services/analytics.service";
import { tap } from "rxjs/operators";

import {
  LucideAngularModule,
  CheckCircle2,
  Truck,
  Package,
  Home,
  Headphones,
  FileText,
  Printer,
} from "lucide-angular";

@Component({
  selector: "app-order-confirmation-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./order-confirmation-page.component.html",
  styleUrl: "./order-confirmation-page.component.css",
})
export class OrderConfirmationPageComponent {
  readonly icons = {
    CheckCircle2,
    Truck,
    Package,
    Home,
    Headphones,
    FileText,
    Printer,
  };
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly analyticsService = inject(AnalyticsService);
  readonly imageUrlService = inject(ImageUrlService);

  readonly statusSteps = [
    OrderStatus.Confirmed,
    OrderStatus.Processing,
    OrderStatus.Shipped,
    OrderStatus.Delivered,
  ];
  readonly OrderStatus = OrderStatus;

  readonly order$ = combineLatest([
    this.route.paramMap,
    this.orderService.orders$.pipe(
      // Wait for orders to be loaded if they are empty
      tap((orders) => {
        if (!orders || orders.length === 0) {
          // You might want to trigger a refresh here if orders are empty
        }
      }),
    ),
  ]).pipe(
    map(([params, orders]) => {
      const orderIdStr = params.get("orderId");
      if (!orderIdStr) return null;

      const orderId = Number(orderIdStr);
      const foundOrder = orders.find((order) => order.id === orderId);

      // If not found, and we have orders, just take the first one as fallback
      // (This handles cases where IDs might change but we still want to show SOMETHING)
      return foundOrder || (orders.length > 0 ? orders[0] : null);
    }),
    tap((order) => {
      if (order) {
        this.analyticsService.trackPurchase(order);
      }
    }),
  );

  stepState(order: Order, step: OrderStatus): "done" | "active" | "pending" {
    const currentIndex = this.statusSteps.indexOf(order.status);
    const stepIndex = this.statusSteps.indexOf(step);

    if (stepIndex < currentIndex) {
      return "done";
    }
    if (stepIndex === currentIndex) {
      return "active";
    }
    return "pending";
  }

  stepIconClasses(order: Order, step: OrderStatus): string {
    const state = this.stepState(order, step);
    if (state === "pending") {
      return "w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 flex items-center justify-center z-10";
    }
    if (state === "active") {
      return "w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center z-10 border-4 border-white dark:border-background-dark shadow-sm";
    }
    return "w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center z-10";
  }

  stepLabelClasses(order: Order, step: OrderStatus): string {
    const state = this.stepState(order, step);
    if (state === "pending") {
      return "mt-2 text-sm font-medium text-gray-400";
    }
    return "mt-2 text-sm font-semibold";
  }

  connectorClasses(order: Order, index: number): string {
    const currentIndex = this.statusSteps.indexOf(order.status);
    return currentIndex > index
      ? "flex-1 h-1 bg-primary mx-2 -mt-6"
      : "flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2 -mt-6";
  }

  trackOrderItem(_: number, item: OrderItem): number {
    return item.productId;
  }
}

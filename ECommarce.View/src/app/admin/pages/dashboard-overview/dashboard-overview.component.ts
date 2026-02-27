import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import {
  Observable,
  firstValueFrom,
  shareReplay,
  switchMap,
  timer,
} from "rxjs";

import {
  DashboardStats,
  OrderItem,
  PopularProduct,
  StatusDistribution,
  CustomerGrowth,
  DailyTraffic,
} from "../../models/admin-dashboard.models";

import { AdminDashboardService } from "../../services/admin-dashboard.service";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { SiteSettingsService } from "../../../core/services/site-settings.service";
import {
  LucideAngularModule,
  Receipt,
  Eye,
  CreditCard,
  Truck,
  Clock,
  Package,
  Users,
  RotateCcw,
} from "lucide-angular";

@Component({
  selector: "app-dashboard-overview",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./dashboard-overview.component.html",
})
export class DashboardOverviewComponent {
  readonly icons = {
    Receipt,
    Eye,
    CreditCard,
    Truck,
    Clock,
    Package,
    Users,
    RotateCcw,
  };
  private adminDashboardService = inject(AdminDashboardService);
  private settingsService = inject(SiteSettingsService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly destroyRef = inject(DestroyRef);

  settings$ = this.settingsService.getSettings();

  private readonly refreshIntervalMs = 15000;
  protected Math = Math;
  protected date = new Date();

  stats$: Observable<DashboardStats> = this.createLiveStream(() =>
    this.adminDashboardService.getStats(),
  );
  recentOrders$: Observable<OrderItem[]> = this.createLiveStream(() =>
    this.adminDashboardService.getRecentOrders(),
  );
  popularProducts$: Observable<PopularProduct[]> = this.createLiveStream(() =>
    this.adminDashboardService.getPopularProducts(),
  );
  orderDistribution$: Observable<StatusDistribution[]> = this.createLiveStream(
    () => this.adminDashboardService.getOrderDistribution(),
  );
  customerGrowth$: Observable<CustomerGrowth[]> = this.createLiveStream(() =>
    this.adminDashboardService.getCustomerGrowth(),
  );
  dailyTraffic$: Observable<DailyTraffic> = this.createLiveStream(() =>
    this.adminDashboardService.getDailyTraffic(),
  );

  statusClass(status: OrderItem["status"]): string {
    switch (status) {
      case "Completed":
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Pending":
      case "Processing":
      case "Confirmed":
      case "Packed":
        return "bg-yellow-100 text-yellow-800";
      case "Shipped":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  private createLiveStream<T>(source: () => Observable<T>): Observable<T> {
    return timer(0, this.refreshIntervalMs).pipe(
      switchMap(() => source()),
      takeUntilDestroyed(this.destroyRef),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}

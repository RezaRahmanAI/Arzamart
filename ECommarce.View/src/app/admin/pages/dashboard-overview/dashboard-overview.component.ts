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
  PlusCircle,
  ShoppingCart,
  PackagePlus,
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
    PlusCircle,
    ShoppingCart,
    PackagePlus,
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

  dailyTraffic$: Observable<DailyTraffic> = this.createLiveStream(() =>
    this.adminDashboardService.getDailyTraffic(),
  );

  private createLiveStream<T>(source: () => Observable<T>): Observable<T> {
    return timer(0, this.refreshIntervalMs).pipe(
      switchMap(() => source()),
      takeUntilDestroyed(this.destroyRef),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}

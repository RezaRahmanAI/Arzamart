import { isPlatformBrowser, CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, PLATFORM_ID } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import {
  Observable,
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
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-dashboard-overview",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PriceDisplayComponent,
    AppIconComponent,
  ],
  templateUrl: "./dashboard-overview.component.html",
})
export class DashboardOverviewComponent {
  private adminDashboardService = inject(AdminDashboardService);
  private settingsService = inject(SiteSettingsService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

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
    const isBrowser = isPlatformBrowser(this.platformId);
    const stream$ = isBrowser 
      ? timer(0, this.refreshIntervalMs) 
      : timer(0);

    return stream$.pipe(
      switchMap(() => source()),
      takeUntilDestroyed(this.destroyRef),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}

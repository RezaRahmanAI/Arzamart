import { isPlatformBrowser, NgIf, AsyncPipe, NgFor } from '@angular/common';
import { Component, ChangeDetectionStrategy, DestroyRef, inject, PLATFORM_ID } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import {
  Observable,
  shareReplay,
  switchMap,
  timer,
  BehaviorSubject,
  combineLatest,
} from "rxjs";

import {
  DashboardStats,
  DailyTraffic,
} from "../../models/admin-dashboard.models";

import { DashboardService } from "../../services/dashboard.service";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { SiteSettingsService } from "../../../core/services/site-settings.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-dashboard-overview",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, AsyncPipe, RouterModule, PriceDisplayComponent, AppIconComponent, NgFor, FormsModule],
  templateUrl: "./dashboard-overview.component.html",
})
export class DashboardOverviewComponent {
  private adminDashboardService = inject(DashboardService);
  private settingsService = inject(SiteSettingsService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  settings$ = this.settingsService.getSettings();

  private readonly refreshIntervalMs = 15000;
  protected Math = Math;
  protected date = new Date();

  // Date filters
  startDate: string = '';
  endDate: string = '';
  activeFilterRange: string = 'all'; // preset selection: 'today', 'yesterday', 'week', 'month', 'all'
  private refreshTrigger$ = new BehaviorSubject<number>(0);

  stats$: Observable<DashboardStats> = this.createLiveStream(() =>
    this.adminDashboardService.getStats(this.startDate || undefined, this.endDate || undefined),
  );

  dailyTraffic$: Observable<DailyTraffic> = this.createLiveStream(() =>
    this.adminDashboardService.getDailyTraffic(),
  );

  triggerRefresh(): void {
    this.refreshTrigger$.next(this.refreshTrigger$.value + 1);
  }

  applyFilter(): void {
    this.activeFilterRange = 'custom';
    this.triggerRefresh();
  }

  setRange(range: string): void {
    this.activeFilterRange = range;
    const now = new Date();
    
    // Helper to format Date to YYYY-MM-DD local time
    const formatLocalDate = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (range === 'today') {
      const start = new Date(now);
      const end = new Date(now);
      this.startDate = formatLocalDate(start);
      this.endDate = formatLocalDate(end);
    } 
    else if (range === 'yesterday') {
      const start = new Date(now);
      start.setDate(now.getDate() - 1);
      const end = new Date(now);
      end.setDate(now.getDate() - 1);
      this.startDate = formatLocalDate(start);
      this.endDate = formatLocalDate(end);
    } 
    else if (range === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      const end = new Date(now);
      this.startDate = formatLocalDate(start);
      this.endDate = formatLocalDate(end);
    } 
    else if (range === 'month') {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      const end = new Date(now);
      this.startDate = formatLocalDate(start);
      this.endDate = formatLocalDate(end);
    } 
    else {
      // 'all'
      this.startDate = '';
      this.endDate = '';
    }

    this.triggerRefresh();
  }

  private createLiveStream<T>(source: () => Observable<T>): Observable<T> {
    const isBrowser = isPlatformBrowser(this.platformId);
    const timer$ = isBrowser 
      ? timer(0, this.refreshIntervalMs) 
      : timer(0);

    return combineLatest([timer$, this.refreshTrigger$]).pipe(
      switchMap(() => source()),
      takeUntilDestroyed(this.destroyRef),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}

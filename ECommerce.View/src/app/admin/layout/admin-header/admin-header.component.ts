import { NgIf, AsyncPipe, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter, map, startWith, Subject, takeUntil } from "rxjs";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { SidebarService } from "../../services/sidebar.service";
import { AuthService } from "../../../core/services/auth.service";
import { SiteSettingsService } from "../../../core/services/site-settings.service";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { SignalrService } from "../../../core/services/signalr.service";

@Component({
  selector: "app-admin-header",
  standalone: true,
  imports: [NgIf, AsyncPipe, NgFor, DatePipe, DecimalPipe, ReactiveFormsModule, AppIconComponent, RouterModule],
  templateUrl: "./admin-header.component.html",
})
export class AdminHeaderComponent implements OnInit, OnDestroy {

  protected sidebarService = inject(SidebarService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  protected authService = inject(AuthService);
  private settingsService = inject(SiteSettingsService);
  public imageUrlService = inject(ImageUrlService);
  private signalrService = inject(SignalrService);
  private cdr = inject(ChangeDetectorRef);

  currentUser$ = this.authService.currentUser;
  settings$ = this.settingsService.getSettings();
  isProfileDropdownOpen = false;
  isNotificationDropdownOpen = false;

  notifications: any[] = [];
  unreadCount = 0;

  pageTitle$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => this.resolveTitle(this.activatedRoute)),
  );

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.signalrService.newOrders$
      .pipe(takeUntil(this.destroy$))
      .subscribe((order) => {
        this.notifications.unshift({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          total: order.total,
          read: false,
          time: new Date()
        });
        this.unreadCount++;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    if (this.isProfileDropdownOpen) {
      this.isNotificationDropdownOpen = false;
    }
  }

  toggleNotificationDropdown() {
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    if (this.isNotificationDropdownOpen) {
      this.isProfileDropdownOpen = false;
      this.unreadCount = 0; // Mark as read when they open the dropdown
    }
  }

  clearNotifications() {
    this.notifications = [];
    this.unreadCount = 0;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }

  private resolveTitle(route: ActivatedRoute): string {
    let currentRoute: ActivatedRoute | null = route.firstChild;
    while (currentRoute) {
      const title = currentRoute.snapshot.data["title"] as string | undefined;
      if (title) {
        return title;
      }
      currentRoute = currentRoute.firstChild;
    }
    return "Dashboard Overview";
  }
}

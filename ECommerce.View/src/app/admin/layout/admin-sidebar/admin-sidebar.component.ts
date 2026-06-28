import { NgIf, NgClass, AsyncPipe, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { SidebarService } from "../../services/sidebar.service";

interface AdminNavItem {
  label: string;
  icon: string;
  route: string;
  menuKey?: string;
}

import { SiteSettingsService } from "../../../core/services/site-settings.service";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-admin-sidebar",
  standalone: true,
  imports: [NgIf, NgClass, AsyncPipe, RouterModule, AppIconComponent, NgFor],
  templateUrl: "./admin-sidebar.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  protected sidebarService = inject(SidebarService);
  private router = inject(Router);
  private settingsService = inject(SiteSettingsService);
  public imageUrlService = inject(ImageUrlService);
  protected authService = inject(AuthService);

  settings$ = this.settingsService.getSettings();



  topItems: AdminNavItem[] = [
    { label: "Overview", icon: "LayoutDashboard", route: "/admin/dashboard", menuKey: "dashboard" },
  ];



  ngOnInit() {
    // Open menu if we are on a relevant route
    const url = this.router.url;
    if (url.includes("/admin/products") || url.includes("/admin/inventory")) {
      this.isProductsMenuOpen = true;
    }
    if (url.includes("/admin/orders/create") || url.includes("/admin/orders/pre-order")) {
      this.isOrdersMenuOpen = true;
    }
    if (url === "/admin/orders" || url.includes("/admin/orders/pre-orders") || url.includes("/admin/orders/website")) {
      this.isOrderViewMenuOpen = true;
    }
    if (url.includes("/admin/staff") || url.includes("/admin/roles")) {
      this.isStaffMenuOpen = true;
    }
  }

  navItems: AdminNavItem[] = [
    { label: "Banners & Campaigns", icon: "GalleryVertical", route: "/admin/banners", menuKey: "banners" },
    { label: "Site Content", icon: "FileText", route: "/admin/pages", menuKey: "pages" },
    { label: "Order Sources", icon: "Globe", route: "/admin/order-sources", menuKey: "order-sources" },
    { label: "Customer Reviews", icon: "MessageSquare", route: "/admin/reviews", menuKey: "reviews" },
    { label: "Customers", icon: "Users", route: "/admin/customers", menuKey: "customers" },
  ];

  bottomItems: AdminNavItem[] = [];

  isProductsMenuOpen = true;
  isOrdersMenuOpen = true;
  isOrderViewMenuOpen = true;
  isStaffMenuOpen = true;

  currentUserRole = "";
  currentUserMenus: string[] = [];

  constructor() {
    this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUserRole = user?.role || "";
      this.currentUserMenus = user?.allowedMenus || [];
    });
  }

  hasAccess(menuKey: string): boolean {
    if (this.currentUserRole === 'Super Admin' || this.currentUserRole === 'SuperAdmin' || this.currentUserRole === 'Admin') return true;
    return this.currentUserMenus.includes(menuKey);
  }

  toggleProductsMenu() {
    this.isProductsMenuOpen = !this.isProductsMenuOpen;
  }

  toggleOrdersMenu() {
    this.isOrdersMenuOpen = !this.isOrdersMenuOpen;
  }

  toggleOrderViewMenu() {
    this.isOrderViewMenuOpen = !this.isOrderViewMenuOpen;
  }

  toggleStaffMenu() {
    this.isStaffMenuOpen = !this.isStaffMenuOpen;
  }

  isGroupActive(paths: string[]): boolean {
    return paths.some(path => this.router.url.includes(path));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

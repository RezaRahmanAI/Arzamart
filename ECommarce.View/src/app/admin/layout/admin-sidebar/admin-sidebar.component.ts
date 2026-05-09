import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
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
  imports: [CommonModule, RouterModule, AppIconComponent],
  templateUrl: "./admin-sidebar.component.html",
})
export class AdminSidebarComponent implements OnInit {
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
  }

  navItems: AdminNavItem[] = [
    { label: "Banners & Campaigns", icon: "GalleryVertical", route: "/admin/banners", menuKey: "banners" },
    { label: "Site Content", icon: "FileText", route: "/admin/pages", menuKey: "pages" },
    { label: "Order Sources", icon: "Globe", route: "/admin/order-sources", menuKey: "order-sources" },
    { label: "Customer Reviews", icon: "MessageSquare", route: "/admin/reviews", menuKey: "reviews" },
    { label: "Customers", icon: "Users", route: "/admin/customers", menuKey: "customers" },
  ];

  bottomItems: AdminNavItem[] = [];

  isProductsMenuOpen = false;
  isOrdersMenuOpen = false;
  isOrderViewMenuOpen = false;

  currentUserRole = "";
  currentUserMenus: string[] = [];

  constructor() {
    this.authService.currentUser.subscribe(user => {
      this.currentUserRole = user?.role || "";
      this.currentUserMenus = user?.allowedMenus || [];
    });
  }

  hasAccess(menuKey: string): boolean {
    if (this.currentUserRole === 'SuperAdmin' || this.currentUserRole === 'Admin') return true;
    if (this.currentUserRole === 'Staff') {
      return this.currentUserMenus.includes(menuKey);
    }
    return false;
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

  isGroupActive(paths: string[]): boolean {
    return paths.some(path => this.router.url.includes(path));
  }
}

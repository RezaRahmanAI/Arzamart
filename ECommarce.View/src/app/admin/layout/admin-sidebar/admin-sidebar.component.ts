import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { SidebarService } from "../../services/sidebar.service";

interface AdminNavItem {
  label: string;
  icon: string;
  route: string;
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
    { label: "Overview", icon: "LayoutDashboard", route: "/admin/dashboard" },
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
    { label: "Banners & Campaigns", icon: "GalleryVertical", route: "/admin/banners" },
    { label: "Site Content", icon: "FileText", route: "/admin/pages" },
    { label: "Order Sources", icon: "Globe", route: "/admin/order-sources" },
    { label: "Customer Reviews", icon: "MessageSquare", route: "/admin/reviews" },
    { label: "CRM", icon: "Users", route: "/admin/customers" },
  ];

  bottomItems: AdminNavItem[] = [];

  isProductsMenuOpen = false;
  isOrdersMenuOpen = false;
  isOrderViewMenuOpen = false;

  constructor() {
    // Check initial state
    // We can't easily check router state here without injecting Router,
    // but we can default to false or rely on the user opening it.
    // Better: Inject Router to set initial state.
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

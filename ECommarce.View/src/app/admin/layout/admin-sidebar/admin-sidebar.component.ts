import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
import {
  LucideAngularModule,
  LayoutDashboard,
  ShoppingBag,
  Package,
  GalleryVertical,
  FileText,
  MessageSquare,
  Users,
  Shield,
  LineChart,
  Settings,
  Store,
  Eye,
  LogOut,
  ChevronDown,
  ChevronUp,
  X,
  Heart,
} from "lucide-angular";
import { SidebarService } from "../../services/sidebar.service";

interface AdminNavItem {
  label: string;
  icon: any; // Changed Type to any for Lucide icons
  route: string;
}

import { SiteSettingsService } from "../../../core/services/site-settings.service";
import { ImageUrlService } from "../../../core/services/image-url.service";

@Component({
  selector: "app-admin-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: "./admin-sidebar.component.html",
})
export class AdminSidebarComponent implements OnInit {
  protected sidebarService = inject(SidebarService);
  private router = inject(Router);
  private settingsService = inject(SiteSettingsService);
  public imageUrlService = inject(ImageUrlService);

  settings$ = this.settingsService.getSettings();

  readonly icons = {
    Store,
    ShoppingBag,
    ChevronDown,
    ChevronUp,
    Eye,
    LogOut,
    X,
    LayoutDashboard,
    Package,
    GalleryVertical,
    FileText,
    MessageSquare,
    Users,
    Shield,
    LineChart,
    Settings,
  };

  topItems: AdminNavItem[] = [
    { label: "Overview", icon: LayoutDashboard, route: "/admin/dashboard" },
  ];



  ngOnInit() {
    // Open menu if we are on a products route
    if (this.router.url.includes("/admin/products")) {
      this.isProductsMenuOpen = true;
    }

  }

  navItems: AdminNavItem[] = [
    { label: "Sales Orders", icon: ShoppingBag, route: "/admin/orders" },
    { label: "Campaigns", icon: GalleryVertical, route: "/admin/banners" },
    { label: "Site Content", icon: FileText, route: "/admin/pages" },
    { label: "Customer Reviews", icon: MessageSquare, route: "/admin/reviews" },
    { label: "CRM", icon: Users, route: "/admin/customers" },
  ];

  bottomItems: AdminNavItem[] = [
    { label: "System Preferences", icon: Settings, route: "/admin/settings" },
  ];

  isProductsMenuOpen = false;

  constructor() {
    // Check initial state
    // We can't easily check router state here without injecting Router,
    // but we can default to false or rely on the user opening it.
    // Better: Inject Router to set initial state.
  }

  toggleProductsMenu() {
    this.isProductsMenuOpen = !this.isProductsMenuOpen;
  }
}

import { staffGuard } from './guards/staff.guard';
import { Routes } from "@angular/router";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";

export const ADMIN_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./layout/admin-layout/admin-layout.component").then(
        (m) => m.AdminLayoutComponent,
      ),
    providers: [provideCharts(withDefaultRegisterables())],
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./pages/dashboard-overview/dashboard-overview.component").then(
            (m) => m.DashboardOverviewComponent,
          ),
        data: { title: "Dashboard Overview" },
      },
      {
        path: "products",
        loadComponent: () =>
          import("./pages/admin-products/admin-products.component").then(
            (m) => m.AdminProductsComponent,
          ),
        data: { title: "Products", menuKey: "products" }, canActivate: [staffGuard],
      },

      {
        path: "products/categories",
        loadComponent: () =>
          import("./pages/admin-category-management/admin-category-management.component").then(
            (m) => m.AdminCategoryManagementComponent,
          ),
        data: { title: "Main Collections Management", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "products/sub-categories",
        loadComponent: () =>
          import("./pages/admin-sub-category-management/admin-sub-category-management.component").then(
            (m) => m.AdminSubCategoryManagementComponent,
          ),
        data: { title: "Sub Category Management", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "products/groups",
        loadComponent: () =>
          import("./pages/admin-product-group-management/admin-product-group-management.component").then(
            (m) => m.AdminProductGroupManagementComponent,
          ),
        data: { title: "Product Group Management", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "inventory",
        loadComponent: () =>
          import("./pages/admin-inventory/admin-inventory.component").then(
            (m) => m.AdminInventoryComponent,
          ),
        data: { title: "Inventory Management", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "products/create",
        loadComponent: () =>
          import("./pages/admin-product-form/admin-product-form.component").then(
            (m) => m.AdminProductFormComponent,
          ),
        data: { title: "Add Product", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "products/:id/edit",
        loadComponent: () =>
          import("./pages/admin-product-form/admin-product-form.component").then(
            (m) => m.AdminProductFormComponent,
          ),
        data: { title: "Edit Product", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "products/:id/custom-lp",
        loadComponent: () =>
          import("./pages/admin-custom-landing-page-config/admin-custom-landing-page-config.component").then(
            (m) => m.AdminCustomLandingPageConfigComponent,
          ),
        data: { title: "Custom LP Settings", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./pages/admin-orders/admin-orders.component").then(
            (m) => m.AdminOrdersComponent,
          ),
        data: { title: "Order Management", menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/create",
        loadComponent: () =>
          import("./pages/admin-manual-order/admin-manual-order.component").then(
            (m) => m.AdminManualOrderComponent,
          ),
        data: { title: "Manual Order", menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/pre-order",
        loadComponent: () =>
          import("./pages/admin-manual-order/admin-manual-order.component").then(
            (m) => m.AdminManualOrderComponent,
          ),
        data: { title: "Create Pre-order", menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/pre-orders",
        loadComponent: () =>
          import("./pages/admin-orders/admin-orders.component").then(
            (m) => m.AdminOrdersComponent,
          ),
        data: { title: "Pre-order Management", preOrderOnly: true, menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/website",
        loadComponent: () =>
          import("./pages/admin-orders/admin-orders.component").then(
            (m) => m.AdminOrdersComponent,
          ),
        data: { title: "Website Orders", websiteOnly: true, menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/:id",
        loadComponent: () =>
          import("./pages/admin-order-details/admin-order-details.component").then(
            (m) => m.AdminOrderDetailsComponent,
          ),
        data: { title: "Order Details", menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/:id/edit",
        loadComponent: () =>
          import("./pages/admin-manual-order/admin-manual-order.component").then(
            (m) => m.AdminManualOrderComponent,
          ),
        data: { title: "Edit Order", menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "customers",
        loadComponent: () =>
          import("./pages/admin-customers/admin-customers.component").then(
            (m) => m.AdminCustomersComponent,
          ),
        data: { title: "Customers", description: "Customer management", menuKey: "customers" }, canActivate: [staffGuard],
      },
      {
        path: "customers/:phone/history",
        loadComponent: () =>
          import("./pages/admin-customer-history/admin-customer-history.component").then(
            (m) => m.AdminCustomerHistoryComponent,
          ),
        data: { title: "Customer History", menuKey: "customers" }, canActivate: [staffGuard],
      },
      {
        path: "analytics",
        loadComponent: () =>
          import("./pages/admin-analytics/admin-analytics.component").then(
            (m) => m.AdminAnalyticsComponent,
          ),
        data: { title: "Analytics", description: "Performance reports", menuKey: "analytics" }, canActivate: [staffGuard],
      },
      {
        path: "settings",
        loadComponent: () =>
          import("./pages/admin-settings/admin-settings.component").then(
            (m) => m.AdminSettingsComponent,
          ),
        data: { title: "Settings", menuKey: "settings" }, canActivate: [staffGuard],
      },
      {
        path: "banners",
        loadComponent: () =>
          import("./pages/admin-banners/admin-banners.component").then(
            (m) => m.AdminBannersComponent,
          ),
        data: { title: "Banners", menuKey: "banners" }, canActivate: [staffGuard],
      },
      {
        path: "navigation",
        loadComponent: () =>
          import("./pages/admin-navigation-management/admin-navigation-management.component").then(
            (m) => m.AdminNavigationManagementComponent,
          ),
        data: { title: "Navigation Management", menuKey: "navigation" }, canActivate: [staffGuard],
      },
      {
        path: "pages",
        loadComponent: () =>
          import("./pages/admin-pages/admin-pages.component").then(
            (m) => m.AdminPagesComponent,
          ),
        data: { title: "Content Pages", menuKey: "pages" }, canActivate: [staffGuard],
      },
      {
        path: "reviews",
        loadComponent: () =>
          import("./pages/admin-reviews/admin-reviews.component").then(
            (m) => m.AdminReviewsComponent,
          ),
        data: { title: "Reviews Management", menuKey: "reviews" }, canActivate: [staffGuard],
      },
      {
        path: "order-sources",
        loadComponent: () =>
          import("./pages/admin-source-management/admin-source-management.component").then(
            (m) => m.AdminSourceManagementComponent,
          ),
        data: { title: "Order Source Management", menuKey: "order-sources" }, canActivate: [staffGuard],
      },
      {
        path: "security",
        loadComponent: () =>
          import("./pages/admin-blocked-ips/admin-blocked-ips.component").then(
            (m) => m.AdminBlockedIpsComponent,
          ),
        data: { title: "Security & IP Blocking", menuKey: "security" }, canActivate: [staffGuard],
      },
      {
        path: "users",
        loadComponent: () =>
          import("./pages/admin-user-management/admin-user-management.component").then(
            (m) => m.AdminUserManagementComponent,
          ),
        data: { title: "User Management", menuKey: "users" }, canActivate: [staffGuard],
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./pages/admin-profile/admin-profile.component").then(
            (m) => m.AdminProfileComponent,
          ),
        data: { title: "My Profile" },
      },
      {
        path: "logout",
        loadComponent: () =>
          import("./pages/admin-logout/admin-logout.component").then(
            (m) => m.AdminLogoutComponent,
          ),
        data: { title: "Logging out" },
      },
    ],
  },
];


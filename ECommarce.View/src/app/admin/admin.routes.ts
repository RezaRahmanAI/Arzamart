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
        data: { title: "Products" },
      },

      {
        path: "products/sub-categories",
        loadComponent: () =>
          import("./pages/admin-sub-category-management/admin-sub-category-management.component").then(
            (m) => m.AdminSubCategoryManagementComponent,
          ),
        data: { title: "Sub Category Management" },
      },
      {
        path: "inventory",
        loadComponent: () =>
          import("./pages/admin-inventory/admin-inventory.component").then(
            (m) => m.AdminInventoryComponent,
          ),
        data: { title: "Inventory Management" },
      },
      {
        path: "products/create",
        loadComponent: () =>
          import("./pages/admin-product-form/admin-product-form.component").then(
            (m) => m.AdminProductFormComponent,
          ),
        data: { title: "Add Product" },
      },
      {
        path: "products/:id/edit",
        loadComponent: () =>
          import("./pages/admin-product-form/admin-product-form.component").then(
            (m) => m.AdminProductFormComponent,
          ),
        data: { title: "Edit Product" },
      },
      {
        path: "products/:id/custom-lp",
        loadComponent: () =>
          import("./pages/admin-custom-landing-page-config/admin-custom-landing-page-config.component").then(
            (m) => m.AdminCustomLandingPageConfigComponent,
          ),
        data: { title: "Custom LP Settings" },
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./pages/admin-orders/admin-orders.component").then(
            (m) => m.AdminOrdersComponent,
          ),
        data: { title: "Order Management" },
      },
      {
        path: "orders/create",
        loadComponent: () =>
          import("./pages/admin-manual-order/admin-manual-order.component").then(
            (m) => m.AdminManualOrderComponent,
          ),
        data: { title: "Manual Order" },
      },
      {
        path: "orders/pre-order",
        loadComponent: () =>
          import("./pages/admin-manual-order/admin-manual-order.component").then(
            (m) => m.AdminManualOrderComponent,
          ),
        data: { title: "Create Pre-order" },
      },
      {
        path: "orders/pre-orders",
        loadComponent: () =>
          import("./pages/admin-orders/admin-orders.component").then(
            (m) => m.AdminOrdersComponent,
          ),
        data: { title: "Pre-order Management", preOrderOnly: true },
      },
      {
        path: "orders/website",
        loadComponent: () =>
          import("./pages/admin-orders/admin-orders.component").then(
            (m) => m.AdminOrdersComponent,
          ),
        data: { title: "Website Orders", websiteOnly: true },
      },
      {
        path: "orders/:id",
        loadComponent: () =>
          import("./pages/admin-order-details/admin-order-details.component").then(
            (m) => m.AdminOrderDetailsComponent,
          ),
        data: { title: "Order Details" },
      },
      {
        path: "orders/:id/edit",
        loadComponent: () =>
          import("./pages/admin-manual-order/admin-manual-order.component").then(
            (m) => m.AdminManualOrderComponent,
          ),
        data: { title: "Edit Order" },
      },
      {
        path: "customers",
        loadComponent: () =>
          import("./pages/admin-customers/admin-customers.component").then(
            (m) => m.AdminCustomersComponent,
          ),
        data: { title: "Customers", description: "Customer management" },
      },
      {
        path: "customers/:phone/history",
        loadComponent: () =>
          import("./pages/admin-orders/admin-orders.component").then(
            (m) => m.AdminOrdersComponent,
          ),
        data: { title: "Customer History" },
      },
      {
        path: "analytics",
        loadComponent: () =>
          import("./pages/admin-analytics/admin-analytics.component").then(
            (m) => m.AdminAnalyticsComponent,
          ),
        data: { title: "Analytics", description: "Performance reports" },
      },
      {
        path: "settings",
        loadComponent: () =>
          import("./pages/admin-settings/admin-settings.component").then(
            (m) => m.AdminSettingsComponent,
          ),
        data: { title: "Settings" },
      },
      {
        path: "banners",
        loadComponent: () =>
          import("./pages/admin-banners/admin-banners.component").then(
            (m) => m.AdminBannersComponent,
          ),
        data: { title: "Banners" },
      },
      {
        path: "navigation",
        loadComponent: () =>
          import("./pages/admin-navigation-management/admin-navigation-management.component").then(
            (m) => m.AdminNavigationManagementComponent,
          ),
        data: { title: "Navigation Management" },
      },
      {
        path: "pages",
        loadComponent: () =>
          import("./pages/admin-pages/admin-pages.component").then(
            (m) => m.AdminPagesComponent,
          ),
        data: { title: "Content Pages" },
      },
      {
        path: "reviews",
        loadComponent: () =>
          import("./pages/admin-reviews/admin-reviews.component").then(
            (m) => m.AdminReviewsComponent,
          ),
        data: { title: "Reviews Management" },
      },
      {
        path: "order-sources",
        loadComponent: () =>
          import("./pages/admin-source-management/admin-source-management.component").then(
            (m) => m.AdminSourceManagementComponent,
          ),
        data: { title: "Order Source Management" },
      },
      {
        path: "security",
        loadComponent: () =>
          import("./pages/admin-blocked-ips/admin-blocked-ips.component").then(
            (m) => m.AdminBlockedIpsComponent,
          ),
        data: { title: "Security & IP Blocking" },
      },
      {
        path: "users",
        loadComponent: () =>
          import("./pages/admin-user-management/admin-user-management.component").then(
            (m) => m.AdminUserManagementComponent,
          ),
        data: { title: "User Management" },
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

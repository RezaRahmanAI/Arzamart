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
          import("./pages/products/products.component").then(
            (m) => m.ProductsComponent,
          ),
        data: { title: "Products", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "products/categories",
        loadComponent: () =>
          import("./pages/category-management/category-management.component").then(
            (m) => m.CategoryManagementComponent,
          ),
        data: { title: "Main Collections Management", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "products/sub-categories",
        loadComponent: () =>
          import("./pages/sub-category-management/sub-category-management.component").then(
            (m) => m.SubCategoryManagementComponent,
          ),
        data: { title: "Sub Category Management", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "products/groups",
        loadComponent: () =>
          import("./pages/product-group-management/product-group-management.component").then(
            (m) => m.ProductGroupManagementComponent,
          ),
        data: { title: "Product Group Management", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "inventory",
        loadComponent: () =>
          import("./pages/inventory/inventory.component").then(
            (m) => m.InventoryComponent,
          ),
        data: { title: "Inventory Management", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "products/create",
        loadComponent: () =>
          import("./pages/product-form/product-form.component").then(
            (m) => m.ProductFormComponent,
          ),
        data: { title: "Add Product", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "products/:id/edit",
        loadComponent: () =>
          import("./pages/product-form/product-form.component").then(
            (m) => m.ProductFormComponent,
          ),
        data: { title: "Edit Product", menuKey: "products" }, canActivate: [staffGuard],
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./pages/orders/orders.component").then(
            (m) => m.OrdersComponent,
          ),
        data: { title: "Order Management", menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/create",
        loadComponent: () =>
          import("./pages/manual-order/manual-order.component").then(
            (m) => m.ManualOrderComponent,
          ),
        data: { title: "Manual Order", menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/pre-order",
        loadComponent: () =>
          import("./pages/manual-order/manual-order.component").then(
            (m) => m.ManualOrderComponent,
          ),
        data: { title: "Create Pre-order", menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/pre-orders",
        loadComponent: () =>
          import("./pages/orders/orders.component").then(
            (m) => m.OrdersComponent,
          ),
        data: { title: "Pre-order Management", preOrderOnly: true, menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/website",
        loadComponent: () =>
          import("./pages/orders/orders.component").then(
            (m) => m.OrdersComponent,
          ),
        data: { title: "Website Orders", websiteOnly: true, menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/:id",
        loadComponent: () =>
          import("./pages/order-details/order-details.component").then(
            (m) => m.OrderDetailsComponent,
          ),
        data: { title: "Order Details", menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "orders/:id/edit",
        loadComponent: () =>
          import("./pages/manual-order/manual-order.component").then(
            (m) => m.ManualOrderComponent,
          ),
        data: { title: "Edit Order", menuKey: "orders" }, canActivate: [staffGuard],
      },
      {
        path: "customers",
        loadComponent: () =>
          import("./pages/customers/customers.component").then(
            (m) => m.CustomersComponent,
          ),
        data: { title: "Customers", description: "Customer management", menuKey: "customers" }, canActivate: [staffGuard],
      },
      {
        path: "customers/:phone/history",
        loadComponent: () =>
          import("./pages/customer-history/customer-history.component").then(
            (m) => m.CustomerHistoryComponent,
          ),
        data: { title: "Customer History", menuKey: "customers" }, canActivate: [staffGuard],
      },
      {
        path: "analytics",
        loadComponent: () =>
          import("./pages/analytics/analytics.component").then(
            (m) => m.AnalyticsComponent,
          ),
        data: { title: "Analytics", description: "Performance reports", menuKey: "analytics" }, canActivate: [staffGuard],
      },
      {
        path: "settings",
        loadComponent: () =>
          import("./pages/settings/settings.component").then(
            (m) => m.SettingsComponent,
          ),
        data: { title: "Settings", menuKey: "settings" }, canActivate: [staffGuard],
      },
      {
        path: "banners",
        loadComponent: () =>
          import("./pages/banners/banners.component").then(
            (m) => m.BannersComponent,
          ),
        data: { title: "Banners", menuKey: "banners" }, canActivate: [staffGuard],
      },
      {
        path: "navigation",
        loadComponent: () =>
          import("./pages/navigation-management/navigation-management.component").then(
            (m) => m.NavigationManagementComponent,
          ),
        data: { title: "Navigation Management", menuKey: "navigation" }, canActivate: [staffGuard],
      },
      {
        path: "pages",
        loadComponent: () =>
          import("./pages/pages/pages.component").then(
            (m) => m.PagesComponent,
          ),
        data: { title: "Content Pages", menuKey: "pages" }, canActivate: [staffGuard],
      },
      {
        path: "reviews",
        loadComponent: () =>
          import("./pages/reviews/reviews.component").then(
            (m) => m.ReviewsComponent,
          ),
        data: { title: "Reviews Management", menuKey: "reviews" }, canActivate: [staffGuard],
      },
      {
        path: "order-sources",
        loadComponent: () =>
          import("./pages/source-management/source-management.component").then(
            (m) => m.SourceManagementComponent,
          ),
        data: { title: "Order Source Management", menuKey: "order-sources" }, canActivate: [staffGuard],
      },
      {
        path: "security",
        loadComponent: () =>
          import("./pages/blocked-ips/blocked-ips.component").then(
            (m) => m.BlockedIpsComponent,
          ),
        data: { title: "Security & IP Blocking", menuKey: "security" }, canActivate: [staffGuard],
      },
      {
        path: "staff",
        loadComponent: () =>
          import("./pages/staff-management/staff-management.component").then(
            (m) => m.StaffManagementComponent,
          ),
        data: { title: "Staff Management", menuKey: "users" }, canActivate: [staffGuard],
      },
      {
        path: "roles",
        loadComponent: () =>
          import("./pages/role-management/role-management.component").then(
            (m) => m.RoleManagementComponent,
          ),
        data: { title: "Role Management Matrix", menuKey: "users" }, canActivate: [staffGuard],
      },
      {
        path: "staff/audit",
        loadComponent: () =>
          import("./pages/staff-audit-log/staff-audit-log.component").then(
            (m) => m.StaffAuditLogComponent,
          ),
        data: { title: "Staff Audit Trail", menuKey: "users" }, canActivate: [staffGuard],
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./pages/profile/profile.component").then(
            (m) => m.ProfileComponent,
          ),
        data: { title: "My Profile" },
      },
      {
        path: "logout",
        loadComponent: () =>
          import("./pages/logout/logout.component").then(
            (m) => m.LogoutComponent,
          ),
        data: { title: "Logging out" },
      },
    ],
  },
];

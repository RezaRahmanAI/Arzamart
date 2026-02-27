import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { AdminGuard } from "./admin/guards/admin.guard";

export const appRoutes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./features/home/pages/home-page/home-page.component").then(
        (m) => m.HomePageComponent,
      ),
  },
  {
    path: "men",
    loadComponent: () =>
      import("./features/men/pages/men-products-page/men-products-page.component").then(
        (m) => m.MenProductsPageComponent,
      ),
  },
  {
    path: "women",
    loadComponent: () =>
      import("./features/women/pages/women-products-page/women-products-page.component").then(
        (m) => m.WomenProductsPageComponent,
      ),
  },
  {
    path: "children",
    loadComponent: () =>
      import("./features/children/pages/children-products-page/children-products-page.component").then(
        (m) => m.ChildrenProductsPageComponent,
      ),
  },
  {
    path: "accessories",
    loadComponent: () =>
      import("./features/accessories/pages/accessories-page/accessories-page.component").then(
        (m) => m.AccessoriesPageComponent,
      ),
  },
  { path: "products", redirectTo: "women", pathMatch: "full" },
  {
    path: "search",
    loadComponent: () =>
      import("./features/products/pages/product-gallery/product-gallery.component").then(
        (m) => m.ProductGalleryComponent,
      ),
    title: "Search Results",
  },
  {
    path: "about",
    loadComponent: () =>
      import("./pages/about/about.component").then((m) => m.AboutComponent),
    title: "About Us",
  },
  {
    path: "contact",
    loadComponent: () =>
      import("./pages/contact/contact.component").then(
        (m) => m.ContactComponent,
      ),
    title: "Contact",
  },
  {
    path: "product/:slug",
    loadComponent: () =>
      import("./features/product-details/pages/product-details-page/product-details-page.component").then(
        (m) => m.ProductDetailsPageComponent,
      ),
  },
  {
    path: "lp/:slug",
    loadComponent: () =>
      import("./features/landing-page/pages/landing-page/landing-page.component").then(
        (m) => m.LandingPageComponent,
      ),
  },
  {
    path: "offer/:slug",
    loadComponent: () =>
      import("./features/offers/pages/offer-details-page/offer-details-page.component").then(
        (m) => m.OfferDetailsPageComponent,
      ),
  },
  {
    path: "cart",
    loadComponent: () =>
      import("./features/cart/pages/cart-page/cart-page.component").then(
        (m) => m.CartPageComponent,
      ),
  },
  {
    path: "checkout",
    loadComponent: () =>
      import("./features/checkout/pages/checkout-page/checkout-page.component").then(
        (m) => m.CheckoutPageComponent,
      ),
  },
  {
    path: "order-confirmation/:orderId",
    loadComponent: () =>
      import("./features/order-confirmation/pages/order-confirmation-page/order-confirmation-page.component").then(
        (m) => m.OrderConfirmationPageComponent,
      ),
  },
  {
    path: "track/:orderId",
    loadComponent: () =>
      import("./features/placeholder/placeholder.component").then(
        (m) => m.PlaceholderComponent,
      ),
    data: {
      title: "Track Order",
      description: "Order tracking experience coming soon.",
    },
  },
  {
    path: "login",
    loadComponent: () =>
      import("./features/login/pages/login-page/login.page").then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: "forgot-password",
    loadComponent: () =>
      import("./features/placeholder/placeholder.component").then(
        (m) => m.PlaceholderComponent,
      ),
    data: {
      title: "Forgot Password",
      description: "Password recovery experience coming soon.",
    },
  },
  {
    path: "blog",
    loadComponent: () =>
      import("./features/blog/pages/blog-list/blog-list.component").then(
        (m) => m.BlogListComponent,
      ),
  },
  {
    path: "blog/:slug",
    loadComponent: () =>
      import("./features/blog/pages/blog-details/blog-details.component").then(
        (m) => m.BlogDetailsComponent,
      ),
  },
  {
    path: "profile",
    loadComponent: () =>
      import("./features/customer-profile/pages/profile-page/profile-page.component").then(
        (m) => m.ProfilePageComponent,
      ),
  },
  {
    path: "account",
    loadComponent: () =>
      import("./features/account/pages/account-page/account-page.component").then(
        (m) => m.AccountPageComponent,
      ),
  },
  {
    path: "orders",
    loadComponent: () =>
      import("./features/orders/pages/orders-page/orders-page.component").then(
        (m) => m.OrdersPageComponent,
      ),
  },
  {
    path: "admin",
    loadComponent: () =>
      import("./admin/layout/admin-layout/admin-layout.component").then(
        (m) => m.AdminLayoutComponent,
      ),
    canActivate: [AdminGuard],
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./admin/pages/dashboard-overview/dashboard-overview.component").then(
            (m) => m.DashboardOverviewComponent,
          ),
        data: { title: "Dashboard Overview" },
      },
      {
        path: "products",
        loadComponent: () =>
          import("./admin/pages/admin-products/admin-products.component").then(
            (m) => m.AdminProductsComponent,
          ),
        data: { title: "Products" },
      },
      {
        path: "products/categories",
        loadComponent: () =>
          import("./admin/pages/admin-category-management/admin-category-management.component").then(
            (m) => m.AdminCategoryManagementComponent,
          ),
        data: { title: "Category Management" },
      },
      {
        path: "products/sub-categories",
        loadComponent: () =>
          import("./admin/pages/admin-sub-category-management/admin-sub-category-management.component").then(
            (m) => m.AdminSubCategoryManagementComponent,
          ),
        data: { title: "Sub Category Management" },
      },
      {
        path: "inventory",
        loadComponent: () =>
          import("./admin/pages/admin-inventory/admin-inventory.component").then(
            (m) => m.AdminInventoryComponent,
          ),
        data: { title: "Inventory Management" },
      },
      {
        path: "products/create",
        loadComponent: () =>
          import("./admin/pages/admin-product-form/admin-product-form.component").then(
            (m) => m.AdminProductFormComponent,
          ),
        data: { title: "Add Product" },
      },
      {
        path: "products/:id/edit",
        loadComponent: () =>
          import("./admin/pages/admin-product-form/admin-product-form.component").then(
            (m) => m.AdminProductFormComponent,
          ),
        data: { title: "Edit Product" },
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./admin/pages/admin-orders/admin-orders.component").then(
            (m) => m.AdminOrdersComponent,
          ),
        data: { title: "Order Management" },
      },
      {
        path: "blog",
        loadComponent: () =>
          import("./admin/pages/admin-blog-posts/admin-blog-posts.component").then(
            (m) => m.AdminBlogPostsComponent,
          ),
        data: { title: "Blog Posts" },
      },
      {
        path: "orders/:id",
        loadComponent: () =>
          import("./admin/pages/admin-order-details/admin-order-details.component").then(
            (m) => m.AdminOrderDetailsComponent,
          ),
        data: { title: "Order Details" },
      },
      {
        path: "customers",
        loadComponent: () =>
          import("./admin/pages/admin-customers/admin-customers.component").then(
            (m) => m.AdminCustomersComponent,
          ),
        data: {
          title: "Customers",
          description: "Customer management",
        },
      },
      {
        path: "analytics",
        loadComponent: () =>
          import("./admin/pages/admin-analytics/admin-analytics.component").then(
            (m) => m.AdminAnalyticsComponent,
          ),
        data: {
          title: "Analytics",
          description: "Performance reports",
        },
      },
      {
        path: "settings",
        loadComponent: () =>
          import("./admin/pages/admin-settings/admin-settings.component").then(
            (m) => m.AdminSettingsComponent,
          ),
        data: { title: "Settings" },
      },
      {
        path: "banners",
        loadComponent: () =>
          import("./admin/pages/admin-banners/admin-banners.component").then(
            (m) => m.AdminBannersComponent,
          ),
        data: { title: "Banners" },
      },
      {
        path: "navigation",
        loadComponent: () =>
          import("./admin/pages/admin-navigation-management/admin-navigation-management.component").then(
            (m) => m.AdminNavigationManagementComponent,
          ),
        data: { title: "Navigation Management" },
      },
      {
        path: "pages",
        loadComponent: () =>
          import("./admin/pages/admin-pages/admin-pages.component").then(
            (m) => m.AdminPagesComponent,
          ),
        data: { title: "Content Pages" },
      },
      {
        path: "reviews",
        loadComponent: () =>
          import("./admin/pages/admin-reviews/admin-reviews.component").then(
            (m) => m.AdminReviewsComponent,
          ),
        data: { title: "Reviews Management" },
      },
      {
        path: "security",
        loadComponent: () =>
          import("./admin/pages/admin-blocked-ips/admin-blocked-ips.component").then(
            (m) => m.AdminBlockedIpsComponent,
          ),
        data: { title: "Security & IP Blocking" },
      },
      {
        path: "logout",
        loadComponent: () =>
          import("./admin/pages/admin-logout/admin-logout.component").then(
            (m) => m.AdminLogoutComponent,
          ),
        data: { title: "Logging out" },
      },
    ],
  },
  {
    path: "category/:slug",
    loadComponent: () =>
      import("./features/products/pages/product-gallery/product-gallery.component").then(
        (m) => m.ProductGalleryComponent,
      ),
  },
  {
    path: "subcategory/:slug",
    loadComponent: () =>
      import("./features/products/pages/product-gallery/product-gallery.component").then(
        (m) => m.ProductGalleryComponent,
      ),
  },
  {
    path: "collection/:slug",
    loadComponent: () =>
      import("./features/products/pages/product-gallery/product-gallery.component").then(
        (m) => m.ProductGalleryComponent,
      ),
  },
  {
    path: "shop/:categorySlug",
    loadComponent: () =>
      import("./features/products/pages/product-gallery/product-gallery.component").then(
        (m) => m.ProductGalleryComponent,
      ),
  },
  {
    path: "shop/:categorySlug/:subCategorySlug",
    loadComponent: () =>
      import("./features/products/pages/product-gallery/product-gallery.component").then(
        (m) => m.ProductGalleryComponent,
      ),
  },
  { path: "**", redirectTo: "" },
];

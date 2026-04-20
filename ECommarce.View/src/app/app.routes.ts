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
    path: "lp/:slug",
    loadComponent: () =>
      import(
        "./features/landing-page/pages/landing-page/landing-page.component"
      ).then((m) => m.LandingPageComponent),
  },
  {
    path: "clp/:slug",
    loadComponent: () =>
      import("./features/landing-page/pages/custom-landing-page/custom-landing-page.component").then(
        (m) => m.CustomLandingPageComponent,
      ),
  },
  {
    path: "product/:slug",
    loadComponent: () =>
      import("./features/product-details/pages/product-details-page/product-details-page.component").then(
        (m) => m.ProductDetailsPageComponent,
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
    loadChildren: () => import("./admin/admin.routes").then((m) => m.ADMIN_ROUTES),
    canActivate: [AdminGuard],
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

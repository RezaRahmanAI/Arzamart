import { Injectable, inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";

declare const fbq: any;
declare const gtag: any;

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);

  trackPageView(): void {
    if (typeof fbq === "function") {
      fbq("track", "PageView");
    }
    if (typeof gtag === "function") {
      // In SPA, PageView is usually automatically tracked if configured correctly,
      // but we can manually fire it if needed.
      // gtag('event', 'page_view', { page_path: location.pathname });
    }
  }

  trackViewContent(product: any): void {
    if (typeof fbq === "function") {
      fbq("track", "ViewContent", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: product.price,
        currency: "BDT",
      });
    }
    if (typeof gtag === "function") {
      gtag("event", "view_item", {
        currency: "BDT",
        value: product.price,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: product.price,
          },
        ],
      });
    }
  }

  trackInitiateCheckout(items: any[], total: number): void {
    if (typeof fbq === "function") {
      fbq("track", "InitiateCheckout", {
        content_ids: items.map((i) => i.productId),
        content_type: "product",
        value: total,
        currency: "BDT",
        num_items: items.length,
      });
    }
    if (typeof gtag === "function") {
      gtag("event", "begin_checkout", {
        currency: "BDT",
        value: total,
        items: items.map((i) => ({
          item_id: i.productId,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      });
    }
  }

  trackAddToCart(item: any): void {
    if (typeof fbq === "function") {
      fbq("track", "AddToCart", {
        content_name: item.name,
        content_ids: [item.productId],
        content_type: "product",
        value: item.price * item.quantity,
        currency: "BDT",
      });
    }
    if (typeof gtag === "function") {
      gtag("event", "add_to_cart", {
        currency: "BDT",
        value: item.price * item.quantity,
        items: [
          {
            item_id: item.productId,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
          },
        ],
      });
    }
  }

  trackPurchase(order: any): void {
    if (typeof fbq === "function") {
      fbq("track", "Purchase", {
        value: order.total,
        currency: "BDT",
        content_ids: order.items.map((i: any) => i.productId),
        content_type: "product",
      });
    }
    if (typeof gtag === "function") {
      gtag("event", "purchase", {
        transaction_id: order.id.toString(),
        value: order.total,
        currency: "BDT",
        items: order.items.map((i: any) => ({
          item_id: i.productId,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      });
    }
  }
}

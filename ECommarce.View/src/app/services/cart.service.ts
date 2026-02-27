import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../core/http/http-client";

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number;
}

export interface Cart {
  id: number;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

@Injectable({
  providedIn: "root",
})
export class CartService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/cart";

  getCart(): Observable<Cart> {
    return this.api.get<Cart>(this.baseUrl);
  }

  addToCart(productId: number, quantity: number = 1): Observable<Cart> {
    return this.api.post<Cart>(`${this.baseUrl}/items`, {
      productId,
      quantity,
    });
  }

  updateCartItem(itemId: number, quantity: number): Observable<Cart> {
    return this.api.post<Cart>(`${this.baseUrl}/items/${itemId}`, { quantity });
  }

  removeFromCart(itemId: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/items/${itemId}`);
  }

  clearCart(): Observable<void> {
    return this.api.delete<void>(this.baseUrl);
  }
}

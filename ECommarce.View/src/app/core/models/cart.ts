export interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  color: string;
  size: string;
  imageUrl: string;
  imageAlt: string;
}

export interface CartSummary {
  itemsCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  freeShippingProgress: number;
}

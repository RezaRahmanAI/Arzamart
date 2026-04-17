export interface CartItemDto {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl: string;
  price: number;
  salePrice?: number | null;
  quantity: number;
  size: string;
  availableStock: number;
  compareAtPrice?: number | null;
}

export interface CartDto {
  id: number;
  userId?: string | null;
  guestId?: string | null;
  items: CartItemDto[];
  subtotal: number;
  totalItems: number;
}

export interface AddToCartDto {
  productId: number;
  quantity: number;
  size: string;
}

export interface UpdateCartItemDto {
  quantity: number;
}

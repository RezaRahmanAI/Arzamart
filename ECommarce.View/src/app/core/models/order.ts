export enum OrderStatus {
  Confirmed = "Confirmed",
  Processing = "Processing",
  Packed = "Packed",
  Shipped = "Shipped",
  Delivered = "Delivered",
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  subTotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  itemsCount: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  color?: string;
  size?: string;
  imageUrl?: string;
}

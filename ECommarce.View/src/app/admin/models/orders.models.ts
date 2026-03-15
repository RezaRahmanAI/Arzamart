export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Refund";

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
  updatedAt?: string;
  paymentStatus?: string;
  city?: string;
  area?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  size?: string;
  color?: string;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
}

export interface OrdersQueryParams {
  searchTerm: string;
  status: "All" | OrderStatus;
  dateRange: "Last 7 Days" | "Last 30 Days" | "This Year" | "All Time";
  page: number;
  pageSize: number;
}

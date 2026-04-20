export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "PreOrder"
  | "Hold"
  | "Return"
  | "Exchange"
  | "ReturnProcess"
  | "Refund";

export interface OrderLog {
  id: number;
  statusFrom: string;
  statusTo: string;
  changedBy: string;
  note?: string;
  createdAt: string;
}

export interface OrderNote {
  id: number;
  adminName: string;
  content: string;
  createdAt: string;
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
  updatedAt?: string;
  paymentStatus?: string;
  city?: string;
  area?: string;
  isPreOrder: boolean;
  adminNote?: string;
  sourcePageId?: number;
  sourcePageName?: string;
  socialMediaSourceId?: number;
  socialMediaSourceName?: string;
  logs?: OrderLog[];
  notes?: OrderNote[];
  items?: OrderItem[];
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
  dateRange: "Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "This Year" | "All Time" | "Custom";
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
  preOrderOnly?: boolean;
  websiteOnly?: boolean;
  manualOnly?: boolean;
  sourcePageId?: number;
  socialMediaSourceId?: number;
}

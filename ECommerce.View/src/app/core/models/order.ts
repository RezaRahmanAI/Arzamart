export enum OrderStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  Processing = "Processing",
  Packed = "Packed",
  Shipped = "Shipped",
  Delivered = "Delivered",
  Cancelled = "Cancelled",
  PreOrder = "PreOrder",
  Hold = "Hold",
  Return = "Return",
  Exchange = "Exchange",
  ReturnProcess = "ReturnProcess",
  Refund = "Refund",
}

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

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  size?: string;
  imageUrl?: string;
  color?: string;
  isStockAvailable?: boolean;
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

  deliveryMethodId?: number;
  discount?: number;
  advancePayment?: number;
  updatedAt?: string;
  paymentStatus?: string;
  city?: string;
  area?: string;
  isPreOrder?: boolean;
  isStockAvailable?: boolean;
  adminNote?: string;
  customerNote?: string;
  sourcePageId?: number;
  sourcePageName?: string;
  socialMediaSourceId?: number;
  socialMediaSourceName?: string;
  logs?: OrderLog[];
  notes?: OrderNote[];
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
  customerPhone?: string;
  productId?: number;
  orderNumber?: string;
}

export interface OrderStats {
  totalOrders: number;
  processing: number;
  totalRevenue: number;
  refundRequests: number;
}

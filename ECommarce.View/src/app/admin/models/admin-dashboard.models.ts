export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  returnedOrders: number;
  customerQueries: number;
  totalPurchaseCost: number;
  averageSellingPrice: number;
  returnValue: number;
  returnRate: string;
  totalProducts: number;
  totalCustomers: number;
}

export interface OrderItem {
  id: number;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  total: number;
  status: string;
  paymentStatus: string;
}

export interface PopularProduct {
  id: number;
  name: string;
  soldCount: number;
  price: number;
  imageUrl: string;
  stock: number;
}

export interface SalesData {
  date: string;
  amount: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface CustomerGrowth {
  date: string;
  count: number;
}

export interface DailyTraffic {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
}

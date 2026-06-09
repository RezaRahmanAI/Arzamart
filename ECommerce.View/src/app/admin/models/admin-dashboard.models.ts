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

  // Row 1
  todayOrdersCount: number;
  todayOrdersRevenue: number;
  todayPendingCount: number;
  todayPendingRevenue: number;
  todayConfirmCount: number;
  todayConfirmRevenue: number;
  todayPackagingCount: number;
  todayPackagingRevenue: number;
  todayShippedCount: number;
  todayShippedRevenue: number;
  todayPreOrdersCount: number;
  todayPreOrdersRevenue: number;
  wapaShopCount: number;
  wapaShopRevenue: number;
  mirpurShopCount: number;
  mirpurShopRevenue: number;
  pathaoReturnCount: number;
  pathaoReturnRevenue: number;
  pathaoDeliveredCount: number;
  pathaoDeliveredRevenue: number;

  // Row 2
  totalPendingCount: number;
  totalPendingRevenue: number;
  totalConfirmCount: number;
  totalConfirmRevenue: number;
  totalPackagingCount: number;
  totalPackagingRevenue: number;
  totalReturnProcessCount: number;
  totalReturnProcessRevenue: number;
  totalShippedCount: number;
  totalShippedRevenue: number;
  totalPreOrdersCount: number;
  totalPreOrdersRevenue: number;
  incompleteOrdersCount: number;
  incompleteOrdersRevenue: number;
}

export interface RecentOrder {
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

export interface CategorySales {
  categoryName: string;
  amount: number;
}

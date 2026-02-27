import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import {
  DashboardStats,
  OrderItem,
  PopularProduct,
  SalesData,
  StatusDistribution,
  CustomerGrowth,
  DailyTraffic,
} from "../models/admin-dashboard.models";

import { ApiHttpClient } from "../../core/http/http-client";

@Injectable({
  providedIn: "root",
})
export class AdminDashboardService {
  private readonly api = inject(ApiHttpClient);

  getStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>("/admin/dashboard/stats");
  }

  getRecentOrders(): Observable<OrderItem[]> {
    return this.api.get<OrderItem[]>("/admin/dashboard/orders/recent");
  }

  getPopularProducts(): Observable<PopularProduct[]> {
    return this.api.get<PopularProduct[]>("/admin/dashboard/products/popular");
  }

  getSalesAnalytics(period: string = "month"): Observable<SalesData[]> {
    return this.api.get<SalesData[]>(
      `/admin/dashboard/analytics/sales?period=${period}`,
    );
  }

  getOrderDistribution(): Observable<StatusDistribution[]> {
    return this.api.get<StatusDistribution[]>(
      "/admin/dashboard/analytics/order-distribution",
    );
  }

  getCustomerGrowth(): Observable<CustomerGrowth[]> {
    return this.api.get<CustomerGrowth[]>(
      "/admin/dashboard/analytics/customer-growth",
    );
  }

  getDailyTraffic(): Observable<DailyTraffic> {
    return this.api.get<DailyTraffic>("/analytics/daily");
  }
}

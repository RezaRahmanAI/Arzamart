import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import {
  DashboardStats,
  RecentOrder,
  PopularProduct,
  SalesData,
  StatusDistribution,
  CustomerGrowth,
  DailyTraffic,
  CategorySales,
} from "../models/admin-dashboard.models";

import { ApiHttpClient } from "../../core/http/http-client";
import { X_REFRESH } from "../utils/cache.utils";

@Injectable({
  providedIn: "root",
})
export class DashboardService {
  private readonly api = inject(ApiHttpClient);

  getStats(startDate?: string, endDate?: string): Observable<DashboardStats> {
    let url = "/admin/dashboard/stats";
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.api.get<DashboardStats>(url, { headers: X_REFRESH });
  }

  getRecentOrders(): Observable<RecentOrder[]> {
    return this.api.get<RecentOrder[]>("/admin/dashboard/orders/recent", { headers: X_REFRESH });
  }

  getPopularProducts(): Observable<PopularProduct[]> {
    return this.api.get<PopularProduct[]>("/admin/dashboard/products/popular", { headers: X_REFRESH });
  }

  getSalesAnalytics(period: string = "month"): Observable<SalesData[]> {
    return this.api.get<SalesData[]>(
      `/admin/dashboard/analytics/sales?period=${period}`, { headers: X_REFRESH }
    );
  }

  getOrderDistribution(): Observable<StatusDistribution[]> {
    return this.api.get<StatusDistribution[]>(
      "/admin/dashboard/analytics/order-distribution", { headers: X_REFRESH }
    );
  }

  getCustomerGrowth(): Observable<CustomerGrowth[]> {
    return this.api.get<CustomerGrowth[]>(
      "/admin/dashboard/analytics/customer-growth", { headers: X_REFRESH }
    );
  }

  getDailyTraffic(): Observable<DailyTraffic> {
    return this.api.get<DailyTraffic>("/analytics/daily", { headers: X_REFRESH });
  }

  getSalesByCategory(): Observable<CategorySales[]> {
    return this.api.get<CategorySales[]>(
      "/admin/dashboard/analytics/sales-by-category", { headers: X_REFRESH }
    );
  }
}

import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";
import { SalesData, StatusDistribution, CustomerGrowth } from "../../core/models/analytics";

export { SalesData, StatusDistribution, CustomerGrowth } from "../../core/models/analytics";

export interface TopProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  soldCount: number;
  imageUrl: string;
}

@Injectable({
  providedIn: "root",
})
export class ReportsService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/dashboard";

  getSalesData(
    period: "week" | "month" | "year" = "month",
  ): Observable<SalesData[]> {
    return this.api.get<SalesData[]>(`${this.baseUrl}/analytics/sales`, {
      params: { period } as any,
    });
  }

  getOrderStatusDistribution(): Observable<StatusDistribution[]> {
    return this.api.get<StatusDistribution[]>(
      `${this.baseUrl}/analytics/order-distribution`
    );
  }

  getCustomerGrowth(): Observable<CustomerGrowth[]> {
    return this.api.get<CustomerGrowth[]>(`${this.baseUrl}/analytics/customer-growth`);
  }

  getTopProducts(): Observable<TopProduct[]> {
    return this.api.get<TopProduct[]>(`${this.baseUrl}/products/popular`);
  }
}

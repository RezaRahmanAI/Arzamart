import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

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
export class AdminAnalyticsService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/analytics";

  getSalesData(
    period: "week" | "month" | "year" = "month",
  ): Observable<SalesData[]> {
    return this.api.get<SalesData[]>(`${this.baseUrl}/sales`, {
      params: { period } as any,
    });
  }

  getOrderStatusDistribution(): Observable<StatusDistribution[]> {
    return this.api.get<StatusDistribution[]>(
      `${this.baseUrl}/orders/distribution`,
    );
  }

  getCustomerGrowth(): Observable<CustomerGrowth[]> {
    return this.api.get<CustomerGrowth[]>(`${this.baseUrl}/customers/growth`);
  }

  getTopProducts(): Observable<TopProduct[]> {
    return this.api.get<TopProduct[]>(`${this.baseUrl}/products/top`);
  }
}

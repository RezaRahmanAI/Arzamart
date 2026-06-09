import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";
import { X_REFRESH } from "../utils/cache.utils";

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
export class ReportsService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/analytics";

  getSalesData(
    period: "week" | "month" | "year" = "month",
  ): Observable<SalesData[]> {
    return this.api.get<SalesData[]>(`${this.baseUrl}/sales`, {
      params: { period } as any,
      headers: X_REFRESH,
    });
  }

  getOrderStatusDistribution(): Observable<StatusDistribution[]> {
    return this.api.get<StatusDistribution[]>(
      `${this.baseUrl}/orders/distribution`, { headers: X_REFRESH }
    );
  }

  getCustomerGrowth(): Observable<CustomerGrowth[]> {
    return this.api.get<CustomerGrowth[]>(`${this.baseUrl}/customers/growth`, { headers: X_REFRESH });
  }

  getTopProducts(): Observable<TopProduct[]> {
    return this.api.get<TopProduct[]>(`${this.baseUrl}/products/top`, { headers: X_REFRESH });
  }
}

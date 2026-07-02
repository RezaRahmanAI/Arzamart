import { HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import { ApiHttpClient } from "../http/http-client";
import { IncompleteOrderAutosave, IncompleteOrderStats } from "../models/incomplete-order";
import { Order } from "../models/order";

@Injectable({
  providedIn: "root",
})
export class IncompleteOrderApiService {
  private readonly api = inject(ApiHttpClient);

  autosave(dto: IncompleteOrderAutosave): Observable<Order> {
    const options = dto.sessionId
      ? { headers: new HttpHeaders().set("X-Session-Id", dto.sessionId) }
      : {};
    return this.api.post<Order>("/orders/incomplete-autosave", dto, options);
  }

  getIncompleteOrders(params: any): Observable<{ items: Order[]; total: number }> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
        httpParams = httpParams.set(key, params[key]);
      }
    });

    return this.api.get<{ items: Order[]; total: number }>("/admin/incomplete-orders", {
      params: httpParams,
    });
  }

  getIncompleteOrderStats(params: any): Observable<IncompleteOrderStats> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
        httpParams = httpParams.set(key, params[key]);
      }
    });

    return this.api.get<IncompleteOrderStats>("/admin/incomplete-orders/stats", {
      params: httpParams,
    });
  }

  updateStatus(id: number, status: string, note?: string): Observable<any> {
    return this.api.post(`/admin/incomplete-orders/${id}/status`, { status, note });
  }

  convertToOrder(id: number): Observable<Order> {
    return this.api.post<Order>(`/admin/incomplete-orders/${id}/convert`, {});
  }
}

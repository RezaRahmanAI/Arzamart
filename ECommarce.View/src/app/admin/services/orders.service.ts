import { Injectable, inject } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Observable, map } from "rxjs";

import {
  Order,
  OrderDetail,
  OrderStatus,
  OrdersQueryParams,
} from "../models/orders.models";
import { ApiHttpClient } from "../../core/http/http-client";

@Injectable({
  providedIn: "root",
})
export class OrdersService {
  private readonly api = inject(ApiHttpClient);

  getOrderById(id: number): Observable<OrderDetail> {
    return this.api.get<OrderDetail>(`/admin/orders/${id}`);
  }

  getOrders(
    params: OrdersQueryParams,
  ): Observable<{ items: Order[]; total: number }> {
    const fromObject: any = {
      searchTerm: params.searchTerm,
      status: params.status,
      dateRange: params.dateRange,
      page: params.page,
      pageSize: params.pageSize,
      preOrderOnly: params.preOrderOnly ?? false,
    };

    if (params.startDate) fromObject.startDate = params.startDate;
    if (params.endDate) fromObject.endDate = params.endDate;

    const queryParams = new HttpParams({ fromObject });

    return this.api.get<{ items: Order[]; total: number }>("/admin/orders", {
      params: queryParams,
    });
  }

  getFilteredOrders(params: OrdersQueryParams): Observable<Order[]> {
    const fromObject: any = {
      searchTerm: params.searchTerm,
      status: params.status,
      dateRange: params.dateRange,
      preOrderOnly: params.preOrderOnly ?? false,
    };

    if (params.startDate) fromObject.startDate = params.startDate;
    if (params.endDate) fromObject.endDate = params.endDate;

    const queryParams = new HttpParams({ fromObject });

    return this.api.get<Order[]>("/admin/orders/filtered", {
      params: queryParams,
    });
  }

  exportOrders(params: OrdersQueryParams): Observable<string> {
    return this.getFilteredOrders(params).pipe(
      map((rows) => this.buildCsv(rows)),
    );
  }

  print(): void {
    window.print();
  }

  updateStatus(
    orderId: number,
    status: OrderStatus,
    note?: string,
  ): Observable<any> {
    return this.api.post<any>(`/admin/orders/${orderId}/status`, {
      status,
      note,
    });
  }

  addOrderNote(orderId: number, note: string): Observable<Order> {
    return this.api.post<Order>(`/admin/orders/${orderId}/notes`, {
      note,
    });
  }
  
  updateOrder(orderId: number, payload: any): Observable<Order> {
    return this.api.post<Order>(`/admin/orders/${orderId}`, payload);
  }

  private buildCsv(rows: Order[]): string {
    const header = [
      "Order ID",
      "Customer Name",
      "Date",
      "Items",
      "Total",
      "Status",
    ];
    const csvRows = rows.map((order) => [
      order.orderNumber,
      order.customerName,
      order.createdAt,
      order.itemsCount.toString(),
      order.total.toFixed(2),
      order.status,
    ]);
    return [header, ...csvRows].map((row) => row.join(",")).join("\n");
  }
}

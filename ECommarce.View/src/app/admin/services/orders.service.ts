import { Injectable, inject } from "@angular/core";
import { HttpParams, HttpHeaders } from "@angular/common/http";
import { Observable, map } from "rxjs";

import {
  Order,
  OrderDetail,
  OrderStatus,
  OrdersQueryParams,
  OrderStats,
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
    forceRefresh = false
  ): Observable<{ items: Order[]; total: number }> {
    const fromObject: any = {
      searchTerm: params.searchTerm,
      status: params.status,
      dateRange: params.dateRange,
      page: params.page,
      pageSize: params.pageSize,
      preOrderOnly: params.preOrderOnly ?? false,
      websiteOnly: params.websiteOnly ?? false,
      manualOnly: params.manualOnly ?? false,
    };

    if (params.startDate) fromObject.startDate = params.startDate;
    if (params.endDate) fromObject.endDate = params.endDate;
    if (params.sourcePageId != null && (params.sourcePageId as any) !== 'null') fromObject.sourcePageId = params.sourcePageId;
    if (params.socialMediaSourceId != null && (params.socialMediaSourceId as any) !== 'null') fromObject.socialMediaSourceId = params.socialMediaSourceId;
    if (params.customerPhone) fromObject.customerPhone = params.customerPhone;
    if (params.productId) fromObject.productId = params.productId;
    if (params.orderNumber) fromObject.orderNumber = params.orderNumber;

    const queryParams = new HttpParams({ fromObject });
    let headers = new HttpHeaders();
    if (forceRefresh) {
      headers = headers.set("X-Refresh", "true");
    }

    return this.api.get<{ items: Order[]; total: number }>("/admin/orders", {
      params: queryParams,
      headers: headers
    });
  }

  getFilteredOrders(params: OrdersQueryParams): Observable<Order[]> {
    const fromObject: any = {
      searchTerm: params.searchTerm,
      status: params.status,
      dateRange: params.dateRange,
      preOrderOnly: params.preOrderOnly ?? false,
      websiteOnly: params.websiteOnly ?? false,
      manualOnly: params.manualOnly ?? false,
    };

    if (params.startDate) fromObject.startDate = params.startDate;
    if (params.endDate) fromObject.endDate = params.endDate;
    if (params.sourcePageId != null && (params.sourcePageId as any) !== 'null') fromObject.sourcePageId = params.sourcePageId;
    if (params.socialMediaSourceId != null && (params.socialMediaSourceId as any) !== 'null') fromObject.socialMediaSourceId = params.socialMediaSourceId;
    if (params.customerPhone) fromObject.customerPhone = params.customerPhone;
    if (params.productId) fromObject.productId = params.productId;
    if (params.orderNumber) fromObject.orderNumber = params.orderNumber;

    const queryParams = new HttpParams({ fromObject });

    return this.api.get<Order[]>("/admin/orders/filtered", {
      params: queryParams,
    });
  }

  getOrderStats(params: OrdersQueryParams): Observable<OrderStats> {
    const fromObject: any = {
      searchTerm: params.searchTerm,
      status: params.status,
      dateRange: params.dateRange,
      preOrderOnly: params.preOrderOnly ?? false,
      websiteOnly: params.websiteOnly ?? false,
      manualOnly: params.manualOnly ?? false,
    };

    if (params.startDate) fromObject.startDate = params.startDate;
    if (params.endDate) fromObject.endDate = params.endDate;
    if (params.sourcePageId != null && (params.sourcePageId as any) !== 'null') fromObject.sourcePageId = params.sourcePageId;
    if (params.socialMediaSourceId != null && (params.socialMediaSourceId as any) !== 'null') fromObject.socialMediaSourceId = params.socialMediaSourceId;
    if (params.customerPhone) fromObject.customerPhone = params.customerPhone;
    if (params.productId) fromObject.productId = params.productId;
    if (params.orderNumber) fromObject.orderNumber = params.orderNumber;

    const queryParams = new HttpParams({ fromObject });

    return this.api.get<OrderStats>("/admin/orders/stats", {
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

  transferToMainOrder(orderId: number): Observable<any> {
    return this.api.post<any>(`/admin/orders/${orderId}/transfer`, {});
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

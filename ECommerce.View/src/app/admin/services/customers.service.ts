import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";
import { X_REFRESH } from "../utils/cache.utils";

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  isSuspicious: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomersResponse {
  items: Customer[];
  total: number;
}

export interface CustomersQueryParams {
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: "root",
})
export class CustomersService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/customers";

  getCustomers(params: CustomersQueryParams): Observable<CustomersResponse> {
    let httpParams = new HttpParams();

    if (params.searchTerm) {
      httpParams = httpParams.set("searchTerm", params.searchTerm);
    }
    if (params.page) {
      httpParams = httpParams.set("page", params.page);
    }
    if (params.pageSize) {
      httpParams = httpParams.set("pageSize", params.pageSize);
    }

    return this.api.get<CustomersResponse>(this.baseUrl, {
      params: httpParams,
      headers: X_REFRESH,
    });
  }

  flagCustomer(id: number): Observable<any> {
    return this.api.post(`${this.baseUrl}/${id}/flag`, {});
  }

  unflagCustomer(id: number): Observable<any> {
    return this.api.post(`${this.baseUrl}/${id}/unflag`, {});
  }
}

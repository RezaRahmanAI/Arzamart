import { inject, Injectable } from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpContext,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { API_CONFIG, ApiConfig } from "../config/api.config";

export interface ApiResponse<T> {
  data: T;
  etag: string | null;
  cacheVersion: string | null;
  status: number;
}

@Injectable({
  providedIn: "root",
})
export class ApiHttpClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);

  get<T>(
    path: string,
    options: {
      params?: any;
      headers?: HttpHeaders;
      context?: HttpContext;
      withCredentials?: boolean;
    } = {},
  ) {
    return this.http.get<T>(this.buildUrl(path), {
      withCredentials: false,
      ...options,
    });
  }

  getWithHeaders<T>(
    path: string,
    options: {
      params?: any;
      headers?: HttpHeaders;
      context?: HttpContext;
      withCredentials?: boolean;
      ifNoneMatch?: string | null;
    } = {},
  ): Observable<ApiResponse<T>> {
    let headers = options.headers || new HttpHeaders();
    if (options.ifNoneMatch) {
      headers = headers.set("If-None-Match", `"${options.ifNoneMatch}"`);
    }
    return this.http.get<T>(this.buildUrl(path), {
      withCredentials: false,
      params: options.params,
      headers,
      context: options.context,
      observe: "response",
    }).pipe(
      map(response => ({
        data: response.body as T,
        etag: response.headers.get("ETag")?.replace(/"/g, "") ?? null,
        cacheVersion: response.headers.get("Cache-Version") ?? null,
        status: response.status,
      }))
    );
  }

  post<T>(
    path: string,
    body: unknown,
    options: {
      params?: any;
      headers?: HttpHeaders;
      context?: HttpContext;
      withCredentials?: boolean;
    } = {},
  ) {
    return this.http.post<T>(this.buildUrl(path), body, {
      withCredentials: false,
      ...options,
    });
  }

  put<T>(
    path: string,
    body: unknown,
    options: {
      params?: any;
      headers?: HttpHeaders;
      context?: HttpContext;
      withCredentials?: boolean;
    } = {},
  ) {
    return this.http.put<T>(this.buildUrl(path), body, {
      withCredentials: false,
      ...options,
    });
  }

  patch<T>(
    path: string,
    body: unknown,
    options: {
      params?: any;
      headers?: HttpHeaders;
      context?: HttpContext;
      withCredentials?: boolean;
    } = {},
  ) {
    return this.http.patch<T>(this.buildUrl(path), body, {
      withCredentials: false,
      ...options,
    });
  }

  delete<T>(
    path: string,
    options: {
      params?: any;
      headers?: HttpHeaders;
      context?: HttpContext;
      withCredentials?: boolean;
    } = {},
  ) {
    return this.http.delete<T>(this.buildUrl(path), {
      withCredentials: false,
      ...options,
    });
  }

  private buildUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  }
}

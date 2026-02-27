import { inject, Injectable } from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpContext,
} from "@angular/common/http";

import { API_CONFIG, ApiConfig } from "../config/api.config";

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
      withCredentials: true,
      ...options,
    });
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
      withCredentials: true,
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
    // Forcing POST instead of PUT because some production environments block PUT/PATCH
    // and cause CORS issues. The backend is already configured to accept POST for updates.
    return this.http.post<T>(this.buildUrl(path), body, {
      withCredentials: true,
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
    // Append /delete to distinguish from update (PUT) when using POST
    const deletePath = path.endsWith("/") ? `${path}delete` : `${path}/delete`;

    return this.http.post<T>(this.buildUrl(deletePath), null, {
      withCredentials: true,
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

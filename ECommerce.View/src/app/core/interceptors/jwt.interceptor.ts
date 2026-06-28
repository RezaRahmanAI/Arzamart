import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from "@angular/common/http";
import { inject, Injector } from "@angular/core";
import { catchError, finalize, retry, switchMap, throwError, timer } from "rxjs";
import { LoadingService } from "../services/loading.service";
import { StorageKeys } from "../constants/storage-keys";
import { AuthService } from "../services/auth.service";

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const token = localStorage.getItem(StorageKeys.AUTH_TOKEN);
  const isFormData = req.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!isFormData && !req.headers.has("Content-Type")) {
    headers["Content-Type"] = "application/json";
  }

  return next(req.clone({ setHeaders: headers })).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes("auth/refresh") &&
        !req.url.includes("auth/login") &&
        !req.url.includes("auth/logout")
      ) {
        const authService = injector.get(AuthService);
        return authService.refreshToken().pipe(
          switchMap((user) => {
            if (user) {
              const newToken = localStorage.getItem(StorageKeys.AUTH_TOKEN);
              const retryHeaders = {
                ...headers,
                ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
              };
              return next(req.clone({ setHeaders: retryHeaders }));
            }
            authService.logout();
            return throwError(() => error);
          }),
          catchError((refreshErr) => {
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    }),
    retry({
      count: 2,
      delay: (error, retryCount) => {
        // Only retry GET requests and avoid retrying on 4xx/5xx application errors
        if (req.method !== "GET" || (error.status >= 400 && error.status < 600)) {
          throw error;
        }
        return timer(retryCount * 1000);
      },
    }),
  );
};

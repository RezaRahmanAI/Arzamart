import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { finalize, retry, timer } from "rxjs";
import { LoadingService } from "../services/loading.service";

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem("arza_token");
  const isFormData = req.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!isFormData && !req.headers.has("Content-Type")) {
    headers["Content-Type"] = "application/json";
  }

  return next(req.clone({ setHeaders: headers })).pipe(
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

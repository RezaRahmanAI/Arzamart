import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { finalize, retry, timer } from "rxjs";
import { LoadingService } from "../services/loading.service";

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  const token = localStorage.getItem("arza_token");
  const isFormData = req.body instanceof FormData;

  loading.show();

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
      delay: (error, retryCount) => timer(retryCount * 1000),
    }),
    finalize(() => loading.hide()),
  );
};


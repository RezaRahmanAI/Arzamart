import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { finalize } from "rxjs";
import {
  LoadingService,
  SHOW_LOADING,
  SKIP_LOADING,
} from "../services/loading.service";

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading if SKIP_LOADING token is set to true
  if (req.context.get(SKIP_LOADING)) {
    return next(req);
  }

  // Determine if we should show loading
  // 1. Always show for mutations (POST, PUT, DELETE) unless skipped
  // 2. For GET requests, only show if SHOW_LOADING is explicitly set
  const isMutation = ["POST", "PUT", "DELETE"].includes(req.method);

  // Skip loading for cart mutations as they have their own quick toast UI
  const isCartMutation = isMutation && req.url.toLowerCase().includes("/cart");

  const shouldShow =
    (isMutation && !isCartMutation) || req.context.get(SHOW_LOADING);

  if (shouldShow) {
    loadingService.show();
    return next(req).pipe(
      finalize(() => {
        loadingService.hide();
      }),
    );
  }

  return next(req);
};

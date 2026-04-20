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

  // Determine if we should show global loading (e.g. for long actions like checkout)
  // We now only show it if explicitly requested via SHOW_LOADING context
  const shouldShow = req.context.get(SHOW_LOADING);

  if (shouldShow) {
    loadingService.setLoading(true);
    return next(req).pipe(
      finalize(() => {
        loadingService.setLoading(false);
      }),
    );
  }

  return next(req);
};

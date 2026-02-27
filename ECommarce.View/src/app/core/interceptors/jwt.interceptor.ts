import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpContextToken,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService, AuthSession } from "../services/auth.service";
import {
  catchError,
  switchMap,
  throwError,
  BehaviorSubject,
  filter,
  take,
  Observable,
} from "rxjs";

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<
  string | null
>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes("auth/login") &&
        !req.url.includes("auth/refresh")
      ) {
        return handle401Error(req, next, authService);
      }
      return throwError(() => error);
    }),
  );
};

const handle401Error = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
): Observable<HttpEvent<any>> => {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.api
      .post<AuthSession>("/auth/refresh", {}, { withCredentials: true })
      .pipe(
        switchMap((response) => {
          isRefreshing = false;

          // If the backend returned 204 No Content (null response), treat it as a failed refresh
          if (!response || !response.accessToken) {
            authService.logout();
            return throwError(() => new Error("Session expired"));
          }

          authService.setSession(response);
          refreshTokenSubject.next(response.accessToken ?? null);

          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.accessToken}`,
              },
            }),
          );
        }),
        catchError((err) => {
          isRefreshing = false;
          authService.logout();

          // If refresh fails and we were on an admin route, redirect to login
          if (req.url.includes("/admin")) {
            const router = inject(Router); // Injectable inside functional interceptor helper
            void router.navigateByUrl("/admin/login");
          }

          return throwError(() => err);
        }),
      );
  } else {
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => {
        return next(
          req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );
      }),
    );
  }
};

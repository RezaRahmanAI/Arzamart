import { bootstrapApplication } from "@angular/platform-browser";
import {
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
  PreloadAllModules,
} from "@angular/router";
import { provideAnimations } from "@angular/platform-browser/animations";
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
  HttpContext,
  HttpContextToken,
} from "@angular/common/http";
import { APP_INITIALIZER } from "@angular/core";
import { of, EMPTY } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { AuthService } from "./app/core/services/auth.service";

import { AppComponent } from "./app/app.component";
import { appRoutes } from "./app/app.routes";
import { API_CONFIG, ApiConfig } from "./app/core/config/api.config";

import { globalErrorInterceptor } from "./app/core/http/global-error.interceptor";
import { environment } from "./environments/environment";

import { jwtInterceptor } from "./app/core/interceptors/jwt.interceptor";
import { loadingInterceptor } from "./app/core/interceptors/loading.interceptor";
import { httpCacheInterceptor } from "./app/interceptors/cache.interceptor";

export const BYPASS_LOGGING = new HttpContextToken<boolean>(() => false);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled",
      }),
      withPreloading(PreloadAllModules),
    ),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        httpCacheInterceptor,
        jwtInterceptor,
        loadingInterceptor,
        globalErrorInterceptor,
      ]),
    ),
    {
      provide: API_CONFIG,
      useValue: {
        baseUrl: environment.apiBaseUrl,
      },
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => {
        // Only attempt silent refresh if we don't have a token (startup/refresh)
        if (!authService.getAccessToken()) {
          // Use a direct HttpContext to signal interceptors not to log this specific call
          return authService.api
            .post<any>(
              "/auth/refresh",
              {},
              {
                context: new HttpContext().set(BYPASS_LOGGING, true),
                withCredentials: true, // Professional standard: explicit withCredentials
              },
            )
            .pipe(
              tap((response) => {
                if (response) {
                  authService.setSession(response);
                }
              }),
              catchError(() => {
                return EMPTY;
              }),
            );
        }
        return of(null);
      },
      deps: [AuthService],
      multi: true,
    },
  ],
}).catch((err) => console.error(err));

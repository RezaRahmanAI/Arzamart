import { bootstrapApplication } from "@angular/platform-browser";
import {
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
  PreloadAllModules,
  withComponentInputBinding,
} from "@angular/router";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from "@angular/common/http";
import { provideZoneChangeDetection } from "@angular/core";
import { provideClientHydration } from "@angular/platform-browser";
import { DATE_PIPE_DEFAULT_OPTIONS } from "@angular/common";
import { AppComponent } from "./app/app.component";
import { appRoutes } from "./app/app.routes";
import { API_CONFIG } from "./app/core/config/api.config";
import { globalErrorInterceptor } from "./app/core/http/global-error.interceptor";
import { environment } from "./environments/environment";
import { jwtInterceptor } from "./app/core/interceptors/jwt.interceptor";
import { loadingInterceptor } from "./app/core/interceptors/loading.interceptor";
import { httpCacheInterceptor } from "./app/interceptors/cache.interceptor";
import { adminCacheInterceptor } from "./app/interceptors/admin-cache.interceptor";

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled",
      }),
      withPreloading(PreloadAllModules),
      withComponentInputBinding(),
    ),
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        adminCacheInterceptor,
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
      provide: DATE_PIPE_DEFAULT_OPTIONS,
      useValue: { timezone: "+0600" },
    },
  ],
});

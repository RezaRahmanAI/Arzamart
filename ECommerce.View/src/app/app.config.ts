import {
  provideZoneChangeDetection,
  ApplicationConfig,
  APP_INITIALIZER,
} from "@angular/core";
import { provideClientHydration } from "@angular/platform-browser";
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
import { provideServiceWorker } from "@angular/service-worker";
import { DATE_PIPE_DEFAULT_OPTIONS } from "@angular/common";
import { appRoutes } from "./app.routes";
import { API_CONFIG } from "./core/config/api.config";
import { globalErrorInterceptor } from "./core/http/global-error.interceptor";
import { environment } from "../environments/environment";
import { jwtInterceptor } from "./core/interceptors/jwt.interceptor";
import { loadingInterceptor } from "./core/interceptors/loading.interceptor";
import { httpCacheInterceptor } from "./core/interceptors/http-cache.interceptor";
import { adminCacheInterceptor } from "./core/interceptors/admin-cache.interceptor";
import { PrefetchService } from "./core/cache/prefetch.service";

function initializePrefetch(prefetch: PrefetchService): () => void {
  return () => prefetch.prefetchAll();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }),
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
    provideClientHydration(),
    provideServiceWorker("ngsw-worker.js", {
      enabled: environment.production,
      registrationStrategy: "registerWhenStable:30000",
    }),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        globalErrorInterceptor,
        jwtInterceptor,
        httpCacheInterceptor,
        adminCacheInterceptor,
        loadingInterceptor,
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
    {
      provide: APP_INITIALIZER,
      useFactory: initializePrefetch,
      deps: [PrefetchService],
      multi: true,
    },
  ],
};

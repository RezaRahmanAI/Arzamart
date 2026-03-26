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
// BYPASS_LOGGING imported above
} from "@angular/common/http";
import { provideZoneChangeDetection } from "@angular/core";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";
import { AuthService } from "./app/core/services/auth.service";

import { AppComponent } from "./app/app.component";
import { appRoutes } from "./app/app.routes";
import { API_CONFIG, ApiConfig } from "./app/core/config/api.config";

import { globalErrorInterceptor } from "./app/core/http/global-error.interceptor";
import { environment } from "./environments/environment";

import { jwtInterceptor } from "./app/core/interceptors/jwt.interceptor";
import { loadingInterceptor } from "./app/core/interceptors/loading.interceptor";
import { httpCacheInterceptor } from "./app/interceptors/cache.interceptor";

import { BYPASS_LOGGING } from "./app/core/http/tokens";

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
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
    provideCharts(withDefaultRegisterables()),
  ],
})

import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Record attempted URL for redirect after login
  const url = state.url.toLowerCase();
  if (url.startsWith("/checkout") || url.startsWith("/profile") || url.startsWith("/orders") || url.startsWith("/account")) {
    router.navigate(["/profile"], { queryParams: { returnUrl: state.url } });
  } else {
    router.navigate(["/login"], { queryParams: { returnUrl: state.url } });
  }
  return false;
};


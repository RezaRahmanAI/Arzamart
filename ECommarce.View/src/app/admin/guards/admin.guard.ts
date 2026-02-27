import { Injectable } from "@angular/core";
import { CanActivate, Router, UrlTree } from "@angular/router";

import { AuthService } from "../../core/services/auth.service";

@Injectable({
  providedIn: "root",
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    const isLoggedIn = this.authService.isLoggedIn();
    const role = this.authService.getRole();

    if (isLoggedIn && role?.toLowerCase() === "admin") {
      return true;
    }

    return this.router.createUrlTree(["/login"]);
  }
}

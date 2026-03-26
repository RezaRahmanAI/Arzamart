import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { filter, map, startWith, Subject, takeUntil } from "rxjs";
import { LucideAngularModule, Search, Bell, Menu, User, LogOut, Settings, Eye, ChevronDown } from "lucide-angular";
import { SidebarService } from "../../services/sidebar.service";
import { AuthService } from "../../../core/services/auth.service";
import { SiteSettingsService } from "../../../core/services/site-settings.service";
import { ImageUrlService } from "../../../core/services/image-url.service";

@Component({
  selector: "app-admin-header",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: "./admin-header.component.html",
})
export class AdminHeaderComponent implements OnInit, OnDestroy {
  readonly icons = { Search, Bell, Menu, User, LogOut, Settings, Eye, ChevronDown };
  protected sidebarService = inject(SidebarService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  protected authService = inject(AuthService);
  private settingsService = inject(SiteSettingsService);
  public imageUrlService = inject(ImageUrlService);

  currentUser$ = this.authService.currentUser;
  settings$ = this.settingsService.getSettings();
  isProfileDropdownOpen = false;

  pageTitle$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => this.resolveTitle(this.activatedRoute)),
  );

  searchControl = new FormControl("", { nonNullable: true });
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        // eslint-disable-next-line no-console
        console.log("Admin search:", value);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/admin/login"]);
  }

  private resolveTitle(route: ActivatedRoute): string {
    let currentRoute: ActivatedRoute | null = route.firstChild;
    while (currentRoute) {
      const title = currentRoute.snapshot.data["title"] as string | undefined;
      if (title) {
        return title;
      }
      currentRoute = currentRoute.firstChild;
    }
    return "Dashboard Overview";
  }
}

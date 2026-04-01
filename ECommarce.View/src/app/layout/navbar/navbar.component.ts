import { Component, inject, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { combineLatest, map, startWith, filter } from "rxjs";
import {
  LucideAngularModule,
  Search,
  User,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Facebook,
  Instagram,
  Twitter,
  Tag,
  Search as SearchIcon,
} from "lucide-angular";

import { AuthService } from "../../core/services/auth.service";
import { CartService } from "../../core/services/cart.service";
import { SiteSettingsService } from "../../core/services/site-settings.service";
import { ImageUrlService } from "../../core/services/image-url.service";
import { NavigationService } from "../../core/services/navigation.service";
import { CustomerProfileService } from "../../core/services/customer-profile.service";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FormsModule],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.css",
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly settingsService = inject(SiteSettingsService);
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);
  public readonly imageUrlService = inject(ImageUrlService);
  private readonly profileService = inject(CustomerProfileService);

  readonly icons = {
    Search,
    User,
    ShoppingBag,
    Menu,
    X,
    ChevronDown,
    Facebook,
    Instagram,
    Twitter,
    Tag,
  };

  isMenuOpen = false;
  isSearchOpen = false;
  isCategoriesMenuOpen = false;
  searchQuery = "";
  isScrolled = false;

  readonly isHomePage$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map((event: any) => event.url === "/" || event.url === ""),
    startWith(this.router.url === "/" || this.router.url === ""),
  );

  constructor() {
    // Subscription handled by async pipe in template
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 35;
  }

  readonly vm$ = combineLatest([
    this.authService.currentUser.pipe(startWith(null)),
    this.cartService.summary$.pipe(
      startWith(this.cartService.getSummarySnapshot()),
    ),
    this.settingsService.getSettings(),
    this.navigationService.getMegaMenu(),
    this.isHomePage$,
    this.profileService.phone$,
  ]).pipe(
    map(([user, summary, settings, menu, isHomePage, customerPhone]) => ({
      user,
      cartCount: summary.itemsCount,
      settings: settings || null,
      menu,
      isHomePage,
      isCustomerLoggedIn: !!customerPhone,
    })),
  );

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.isSearchOpen = false;
    this.isCategoriesMenuOpen = false;
  }

  toggleCategoriesMenu(): void {
    this.isCategoriesMenuOpen = !this.isCategoriesMenuOpen;
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      setTimeout(() => {
        const input = document.getElementById("navbar-search-input");
        if (input) input.focus();
      }, 100);
    }
  }

  toggleMobileSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      setTimeout(() => {
        const input = document.getElementById("mobile-search-input");
        if (input) input.focus();
      }, 100);
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(["/search"], {
        queryParams: { searchTerm: this.searchQuery.trim() },
      });
      this.isSearchOpen = false;
      this.searchQuery = "";
    }
  }

  logout(): void {
    this.authService.logout();
  }
}

import { Component, inject, OnInit, Renderer2, DestroyRef, PLATFORM_ID, signal } from "@angular/core";
import { AsyncPipe, DOCUMENT, isPlatformBrowser } from "@angular/common";
import { Title } from "@angular/platform-browser";
import { SiteSettingsService } from "./core/services/site-settings.service";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { NavbarComponent } from "./layout/navbar/navbar.component";
import { FooterComponent } from "./layout/footer/footer.component";
import { ToastComponent } from "./shared/components/toast/toast.component";
import { UndoToastComponent } from "./shared/components/toast/undo-toast.component";
import { ContactFabComponent } from "./shared/components/contact-fab/contact-fab.component";
import { AnalyticsService } from "./core/services/analytics.service";
import { AttributionService } from "./core/services/attribution.service";
import { LoadingSpinnerComponent } from "./shared/components/loading-spinner/loading-spinner.component";
import { CartDrawerComponent } from "./shared/components/cart-drawer/cart-drawer.component";
import { CartService } from "./core/services/cart.service";
import { OfflineIndicatorService } from "./core/services/offline-indicator.service";
import { PrefetchService } from "./core/cache/prefetch.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    ToastComponent,
    UndoToastComponent,
    ContactFabComponent,
    LoadingSpinnerComponent,
    CartDrawerComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private siteSettingsService = inject(SiteSettingsService);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private titleService = inject(Title);
  private analyticsService = inject(AnalyticsService);
  private attributionService = inject(AttributionService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  private cartService = inject(CartService);
  private offlineIndicator = inject(OfflineIndicatorService);
  private prefetch = inject(PrefetchService);

  isOffline = signal(false);

  showPublicLayout$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => {
      const url = this.router.url;
      return !url.startsWith("/admin") && !url.startsWith("/login");
    }),
  );

  showNavbar$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => {
      const url = this.router.url;
      return !url.startsWith("/admin") && !url.startsWith("/login") && !url.startsWith("/clp/") && !url.startsWith("/lp/");
    }),
  );

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener(
        "error",
        (event) => {
          const target = event.target;
          if (target instanceof HTMLImageElement) {
            const placeholder = "assets/images/placeholder.png";
            if (!target.src.includes(placeholder)) {
              target.src = placeholder;
            }
          }
        },
        true // capture phase
      );
    }

    // Track PageViews and reset scroll positions on route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Close cart drawer on every navigation
        this.cartService.closeDrawer();

        if (!this.router.url.startsWith("/admin")) {
          this.analyticsService.trackPageView();
        }
        // Reset scroll position for standard viewport and custom scrollable content containers
        if (isPlatformBrowser(this.platformId)) {
          window.scrollTo({ top: 0, behavior: 'instant' });
          this.document.querySelectorAll(".overflow-y-auto").forEach((el) => el.scrollTo({ top: 0, behavior: 'instant' }));
        }
      });

    this.siteSettingsService.getSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((settings) => {
      if (settings.websiteName) {
        this.titleService.setTitle(settings.websiteName);
      }
      if (settings.facebookPixelId) {
        this.injectFacebookPixel(settings.facebookPixelId);
      }
      if (settings.googleTagId) {
        this.injectGoogleTag(settings.googleTagId);
      }
    });

    this.offlineIndicator.isOnline$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(online => {
      this.isOffline.set(!online);
    });

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((e) => {
      if (isPlatformBrowser(this.platformId)) {
        this.prefetch.prefetchRouteData((e as NavigationEnd).urlAfterRedirects);
      }
    });
  }

  private injectFacebookPixel(pixelId: string) {
    if (this.document.getElementById("fb-pixel-script")) return;

    const script = this.renderer.createElement("script");
    script.id = "fb-pixel-script";
    script.text = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
    `;
    this.renderer.appendChild(this.document.head, script);
  }

  private injectGoogleTag(tagId: string) {
    if (this.document.getElementById("google-tag-script")) return;

    const script = this.renderer.createElement("script");
    script.id = "google-tag-script";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
    script.async = true;
    this.renderer.appendChild(this.document.head, script);

    const script2 = this.renderer.createElement("script");
    script2.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${tagId}');
    `;
    this.renderer.appendChild(this.document.head, script2);
  }
}

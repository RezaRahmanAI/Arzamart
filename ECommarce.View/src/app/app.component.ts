import { Component, inject, OnInit, Renderer2 } from "@angular/core";
import { DOCUMENT, CommonModule } from "@angular/common";
import { Title } from "@angular/platform-browser";
import { SiteSettingsService } from "./core/services/site-settings.service";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, map, startWith } from "rxjs";

import { NavbarComponent } from "./layout/navbar/navbar.component";
import { FooterComponent } from "./layout/footer/footer.component";
import { ToastComponent } from "./shared/components/toast/toast.component";
import { ContactFabComponent } from "./shared/components/contact-fab/contact-fab.component";
import { LoggerService } from "./core/services/logger.service";
import { AnalyticsService } from "./core/services/analytics.service";
import { LoadingSpinnerComponent } from "./shared/components/loading-spinner/loading-spinner.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    ToastComponent,
    ContactFabComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private siteSettingsService = inject(SiteSettingsService);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private logger = inject(LoggerService);
  private titleService = inject(Title);
  private analyticsService = inject(AnalyticsService);

  showPublicLayout$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => !this.router.url.startsWith("/admin")),
  );

  ngOnInit() {
    this.logger.info("Application initialized with professional logging");

    // Track PageViews on route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (!this.router.url.startsWith("/admin")) {
          this.analyticsService.trackPageView();
        }
      });

    this.siteSettingsService.getSettings().subscribe((settings) => {
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

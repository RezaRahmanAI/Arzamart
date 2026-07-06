import { Injectable, PLATFORM_ID, inject, NgZone } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { FormGroup } from "@angular/forms";
import { Subscription, debounceTime, distinctUntilChanged } from "rxjs";

import { CartService } from "./cart.service";
import { AttributionService } from "./attribution.service";
import { IncompleteOrderApiService } from "./incomplete-order-api.service";
import { IncompleteOrderAutosave } from "../models/incomplete-order";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class IncompleteOrderTrackerService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cartService = inject(CartService);
  private readonly attributionService = inject(AttributionService);
  private readonly apiService = inject(IncompleteOrderApiService);
  private readonly ngZone = inject(NgZone);

  private formSubscription?: Subscription;
  private currentForm?: FormGroup;
  private currentGetProductDetails?: () => {
    productId: number | null;
    productName: string | null;
    quantity: number;
    totalPrice: number;
    selectedSize?: string;
  };
  private currentGetLandingDetails?: () => {
    landingPageId?: number;
    landingPageName?: string;
  };
  private lastSavedPayload?: IncompleteOrderAutosave;

  constructor() {
    this.setupUnloadListeners();
  }

  trackForm(
    form: FormGroup,
    getProductDetails: () => {
      productId: number | null;
      productName: string | null;
      quantity: number;
      totalPrice: number;
      selectedSize?: string;
    },
    getLandingDetails?: () => {
      landingPageId?: number;
      landingPageName?: string;
    }
  ): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.currentForm = form;
    this.currentGetProductDetails = getProductDetails;
    this.currentGetLandingDetails = getLandingDetails;

    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }

    // Autosave on form value changes (debounced by 1.5 seconds)
    this.formSubscription = form.valueChanges
      .pipe(
        debounceTime(1500),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe(() => {
        this.saveIncompleteOrder();
      });
  }

  private saveIncompleteOrder(): void {
    if (!this.currentForm) return;

    const payload = this.buildPayload();
    if (!payload) return;

    this.lastSavedPayload = payload;
    this.apiService.autosave(payload).subscribe({
      error: (err) => console.warn("Failed to autosave incomplete order: ", err),
    });
  }

  private buildPayload(): IncompleteOrderAutosave | null {
    if (!this.currentForm) return null;

    const formValue = this.currentForm.value;
    const phone = formValue.phone || "";
    const name = formValue.fullName || formValue.name || "";

    // Save only if at least name or phone is partially filled to avoid empty records
    if (!name.trim() && !phone.trim()) {
      return null;
    }

    const sessionId = this.cartService.getSessionId();
    const product = this.currentGetProductDetails ? this.currentGetProductDetails() : null;
    const landing = this.currentGetLandingDetails ? this.currentGetLandingDetails() : null;
    const attribution = this.attributionService.getAttribution();
    const deviceBrowser = this.detectDeviceAndBrowser();

    return {
      sessionId,
      customerName: name,
      customerPhone: phone,
      shippingAddress: formValue.address || undefined,
      city: formValue.city || undefined,
      area: formValue.area || undefined,
      productId: product?.productId || undefined,
      productName: product?.productName || undefined,
      selectedSize: product?.selectedSize || undefined,
      quantity: product?.quantity || undefined,
      totalPrice: product?.totalPrice || undefined,
      landingPageId: landing?.landingPageId || undefined,
      landingPageName: landing?.landingPageName || undefined,
      ...attribution,
      ...deviceBrowser,
    };
  }

  private detectDeviceAndBrowser() {
    if (!isPlatformBrowser(this.platformId)) {
      return { deviceType: "Desktop", browser: "Unknown" };
    }

    const ua = navigator.userAgent;
    const width = window.innerWidth;

    // Detect Device Type
    let deviceType = "Desktop";
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
      deviceType = "Mobile";
    } else if (width < 1024) {
      deviceType = "Tablet";
    }

    // Detect Browser
    let browser = "Unknown";
    if (ua.indexOf("Firefox") > -1) {
      browser = "Firefox";
    } else if (ua.indexOf("SamsungBrowser") > -1) {
      browser = "Samsung Browser";
    } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
      browser = "Opera";
    } else if (ua.indexOf("Trident") > -1) {
      browser = "Internet Explorer";
    } else if (ua.indexOf("Edge") > -1) {
      browser = "Edge";
    } else if (ua.indexOf("Chrome") > -1) {
      browser = "Chrome";
    } else if (ua.indexOf("Safari") > -1) {
      browser = "Safari";
    }

    return { deviceType, browser };
  }

  private setupUnloadListeners(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const flushUnload = () => {
      if (!this.currentForm) return;

      // Always rebuild payload from current form state (not cached)
      const payload = this.buildPayload();
      if (!payload) return;

      this.lastSavedPayload = payload;

      try {
        const url = `${environment.apiBaseUrl}/orders/incomplete-autosave`;
        const body = JSON.stringify(payload);

        // Use fetch with keepalive: true to guarantee delivery on page close
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-Id": payload.sessionId,
          },
          body,
          keepalive: true,
          credentials: "include",
        }).catch((err) => {
          console.warn("Fetch keepalive failed, will retry via HttpClient: ", err);
        });
      } catch (e) {
        console.warn("Failed to flush incomplete order during page unload: ", e);
      }
    };

    window.addEventListener("beforeunload", flushUnload);
    window.addEventListener("pagehide", flushUnload);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        // Try fetch keepalive first
        flushUnload();

        // Fallback: use Angular HttpClient if we have a payload (runs outside zone for speed)
        if (this.lastSavedPayload) {
          this.ngZone.runOutsideAngular(() => {
            this.apiService.autosave(this.lastSavedPayload!).subscribe({
              error: () => {},
            });
          });
        }
      }
    });
  }
}

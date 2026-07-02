import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

@Injectable({
  providedIn: "root",
})
export class AttributionService {
  private readonly platformId = inject(PLATFORM_ID);
  
  private readonly KEYS = {
    UTM_SOURCE: "arz_utm_source",
    UTM_CAMPAIGN: "arz_utm_campaign",
    UTM_ADSET: "arz_utm_adset",
    UTM_AD: "arz_utm_ad",
    FBCLID: "arz_fbclid",
    REFERRER: "arz_referrer"
  };

  constructor() {
    this.captureAttribution();
  }

  private captureAttribution(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Capture UTMs
      const utmSource = urlParams.get("utm_source");
      const utmCampaign = urlParams.get("utm_campaign");
      const utmAdset = urlParams.get("utm_adset");
      const utmAd = urlParams.get("utm_ad");
      const fbclid = urlParams.get("fbclid");
      
      if (utmSource) sessionStorage.setItem(this.KEYS.UTM_SOURCE, utmSource);
      if (utmCampaign) sessionStorage.setItem(this.KEYS.UTM_CAMPAIGN, utmCampaign);
      if (utmAdset) sessionStorage.setItem(this.KEYS.UTM_ADSET, utmAdset);
      if (utmAd) sessionStorage.setItem(this.KEYS.UTM_AD, utmAd);
      if (fbclid) sessionStorage.setItem(this.KEYS.FBCLID, fbclid);

      // Capture Referrer if not already saved
      if (!sessionStorage.getItem(this.KEYS.REFERRER)) {
        const referrer = document.referrer;
        if (referrer) {
          sessionStorage.setItem(this.KEYS.REFERRER, referrer);
        }
      }
    } catch (e) {
      console.warn("Failed to capture marketing attribution: ", e);
    }
  }

  getAttribution() {
    if (!isPlatformBrowser(this.platformId)) {
      return {};
    }

    return {
      utmSource: sessionStorage.getItem(this.KEYS.UTM_SOURCE) || undefined,
      utmCampaign: sessionStorage.getItem(this.KEYS.UTM_CAMPAIGN) || undefined,
      utmAdset: sessionStorage.getItem(this.KEYS.UTM_ADSET) || undefined,
      utmAd: sessionStorage.getItem(this.KEYS.UTM_AD) || undefined,
      fbclid: sessionStorage.getItem(this.KEYS.FBCLID) || undefined,
      referrerUrl: sessionStorage.getItem(this.KEYS.REFERRER) || undefined
    };
  }
}

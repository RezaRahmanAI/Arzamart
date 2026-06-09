import { Injectable, inject } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { tap } from "rxjs/operators";

import {
  AdminSettings,
  ShippingZone,
  DeliveryMethod,
} from "../models/settings.models";
import { ApiHttpClient } from "../../core/http/http-client";
import { X_REFRESH } from "../utils/cache.utils";

@Injectable({ providedIn: "root" })
export class SettingsService {
  private readonly api = inject(ApiHttpClient);
  private settingsSubject = new BehaviorSubject<AdminSettings | null>(null);
  settings$ = this.settingsSubject.asObservable();

  getSettings(): Observable<AdminSettings> {
    return this.api
      .get<AdminSettings>("/admin/settings", { headers: X_REFRESH })
      .pipe(tap((settings) => this.settingsSubject.next(settings)));
  }

  saveSettings(payload: AdminSettings): Observable<AdminSettings> {
    return this.api
      .post<AdminSettings>("/admin/settings", payload)
      .pipe(tap((settings) => this.settingsSubject.next(settings)));
  }

  createShippingZone(payload: ShippingZone): Observable<ShippingZone> {
    return this.api.post<ShippingZone>(
      "/admin/settings/shipping-zones",
      payload,
    );
  }

  updateShippingZone(
    zoneId: number,
    payload: ShippingZone,
  ): Observable<ShippingZone> {
    return this.api.post<ShippingZone>(
      `/admin/settings/shipping-zones/${zoneId}`,
      payload,
    );
  }

  deleteShippingZone(zoneId: number): Observable<boolean> {
    return this.api.delete<boolean>(`/admin/settings/shipping-zones/${zoneId}`);
  }

  // Delivery Methods API
  getDeliveryMethods(): Observable<DeliveryMethod[]> {
    return this.api.get<DeliveryMethod[]>("/admin/settings/delivery-methods", { headers: X_REFRESH });
  }

  getPublicDeliveryMethods(): Observable<DeliveryMethod[]> {
    return this.api.get<DeliveryMethod[]>("/sitesettings/delivery-methods", { headers: X_REFRESH });
  }

  createDeliveryMethod(
    payload: Partial<DeliveryMethod>,
  ): Observable<DeliveryMethod> {
    return this.api.post<DeliveryMethod>(
      "/admin/settings/delivery-methods",
      payload,
    );
  }

  updateDeliveryMethod(
    id: number,
    payload: Partial<DeliveryMethod>,
  ): Observable<void> {
    return this.api.post<void>(
      `/admin/settings/delivery-methods/${id}`,
      payload,
    );
  }

  deleteDeliveryMethod(id: number): Observable<void> {
    return this.api.post<void>(`/admin/settings/delivery-methods/${id}/delete`, {});
  }

  uploadLogo(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.api.post<{ url: string }>("/admin/settings/media", formData);
  }
}

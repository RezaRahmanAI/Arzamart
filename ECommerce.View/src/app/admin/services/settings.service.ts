import { Injectable, inject } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { tap } from "rxjs/operators";

import {
  AdminSettings,
} from "../models/settings.models";
import { DeliveryMethod } from "../../core/models/delivery";
import { ApiHttpClient } from "../../core/http/http-client";

@Injectable({ providedIn: "root" })
export class SettingsService {
  private readonly api = inject(ApiHttpClient);
  private settingsSubject = new BehaviorSubject<AdminSettings | null>(null);
  settings$ = this.settingsSubject.asObservable();

  getSettings(): Observable<AdminSettings> {
    return this.api
      .get<AdminSettings>("/admin/settings")
      .pipe(tap((settings) => this.settingsSubject.next(settings)));
  }

  saveSettings(payload: AdminSettings): Observable<AdminSettings> {
    return this.api
      .post<AdminSettings>("/admin/settings", payload)
      .pipe(tap((settings) => this.settingsSubject.next(settings)));
  }

  // Delivery Methods API
  getDeliveryMethods(): Observable<DeliveryMethod[]> {
    return this.api.get<DeliveryMethod[]>("/admin/settings/delivery-methods");
  }

  getPublicDeliveryMethods(): Observable<DeliveryMethod[]> {
    return this.api.get<DeliveryMethod[]>("/sitesettings/delivery-methods");
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

import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../http/http-client";
import { DeliveryMethod } from "../models/delivery";

@Injectable({ providedIn: "root" })
export class DeliveryService {
  private readonly api = inject(ApiHttpClient);

  getPublicDeliveryMethods(): Observable<DeliveryMethod[]> {
    return this.api.get<DeliveryMethod[]>("/sitesettings/delivery-methods");
  }
}

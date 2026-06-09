import { Injectable, inject } from "@angular/core";
import { SettingsService } from "../../admin/services/settings.service";
import { DeliveryMethod } from "../../admin/models/settings.models";
import { firstValueFrom } from "rxjs";

export interface DeliveryMethodInput {
  city: string;
  area: string;
}

@Injectable({ providedIn: "root" })
export class DeliveryService {
  private readonly settings = inject(SettingsService);
  private readonly outskirts = ["keraniganj", "savar", "ashulia", "asulia", "dohar"];

  async getDeliveryMethod(input: DeliveryMethodInput): Promise<DeliveryMethod | null> {
    const methods = await firstValueFrom(this.settings.getDeliveryMethods());
    if (methods.length < 2) return null;

    const isOutskirts = input.area && this.outskirts.includes(input.area.toLowerCase());
    const isInsideDhaka = input.city.toLowerCase() === "dhaka" && !isOutskirts;

    return methods.find((m) =>
      isInsideDhaka
        ? m.name.toLowerCase().includes("inside")
        : m.name.toLowerCase().includes("outside")
    ) ?? null;
  }

  getOutskirts(): string[] {
    return [...this.outskirts];
  }

  isOutskirtsArea(area: string): boolean {
    return this.outskirts.includes(area.toLowerCase());
  }
}

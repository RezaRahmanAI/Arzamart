import { Injectable } from "@angular/core";
import { BANGLADESH_LOCATIONS } from "../utils/bangladesh-locations";

export interface MatchedLocation {
  city: string | null;
  area: string | null;
}

@Injectable({ providedIn: "root" })
export class LocationService {
  private readonly cities = Object.keys(BANGLADESH_LOCATIONS).sort();

  matchFromAddress(address: string): MatchedLocation {
    if (!address || address.length < 3) {
      return { city: null, area: null };
    }

    const lower = address.toLowerCase();

    for (const city of this.cities) {
      if (lower.includes(city.toLowerCase())) {
        const areas = BANGLADESH_LOCATIONS[city] || [];
        let matchedArea: string | null = null;

        for (const area of areas) {
          if (lower.includes(area.toLowerCase())) {
            matchedArea = area;
            break;
          }
        }

        return { city, area: matchedArea };
      }
    }

    return { city: null, area: null };
  }

  getCities(): string[] {
    return [...this.cities];
  }

  getAreasForCity(city: string): string[] {
    return [...(BANGLADESH_LOCATIONS[city] || [])];
  }
}

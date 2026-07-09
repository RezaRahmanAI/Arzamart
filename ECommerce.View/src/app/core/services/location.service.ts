import { Injectable, inject } from "@angular/core";
import { Observable, map, shareReplay, of, catchError } from "rxjs";
import { ApiHttpClient } from "../http/http-client";
import { CacheService } from "../cache/cache.service";
import {
  DivisionDto,
  DistrictDto,
  UpazilaDto,
  LocationHierarchy,
  DivisionHierarchy,
  DistrictHierarchy,
  UpazilaHierarchy,
  DeliveryZoneListDto,
  DeliveryZoneDto,
} from "../models/location";

@Injectable({
  providedIn: "root",
})
export class LocationService {
  private api = inject(ApiHttpClient);
  private cache = inject(CacheService);

  private hierarchy$: Observable<LocationHierarchy> | null = null;

  getDivisions(): Observable<DivisionDto[]> {
    return this.cache
      .getOrFetch<LocationHierarchy>("locations", "hierarchy", (ifNoneMatch) =>
        this.api.getWithHeaders<LocationHierarchy>("/locations/all", { ifNoneMatch })
      )
      .pipe(
        map((result) =>
          (result.data?.divisions ?? []).map(
            (d): DivisionDto => ({
              id: d.id,
              nameEn: d.nameEn,
              nameBn: d.nameBn,
              displayOrder: d.displayOrder,
              isActive: true,
            })
          )
        ),
        catchError(() => of([] as DivisionDto[]))
      );
  }

  getDistrictsByDivision(divisionId: number): Observable<DistrictDto[]> {
    return this.api.get<DistrictDto[]>(`/locations/divisions/${divisionId}/districts`);
  }

  getUpazilasByDistrict(districtId: number): Observable<UpazilaDto[]> {
    return this.api.get<UpazilaDto[]>(`/locations/districts/${districtId}/upazilas`);
  }

  getAllLocations(): Observable<LocationHierarchy> {
    if (!this.getAll$) {
      this.getAll$ = this.cache
        .getOrFetch<LocationHierarchy>("locations", "all", (ifNoneMatch) =>
          this.api.getWithHeaders<LocationHierarchy>("/locations/all", { ifNoneMatch })
        )
        .pipe(
          map((result) => result.data ?? { divisions: [] }),
          shareReplay(1)
        );
    }
    return this.getAll$;
  }

  private getAll$: Observable<LocationHierarchy> | null = null;

  // --- Delivery Zone Admin Methods ---

  getDeliveryZones(): Observable<DeliveryZoneListDto[]> {
    return this.api.get<DeliveryZoneListDto[]>("/admin/locations/delivery-zones");
  }

  getDeliveryZone(id: number): Observable<DeliveryZoneDto> {
    return this.api.get<DeliveryZoneDto>(`/admin/locations/delivery-zones/${id}`);
  }

  createDeliveryZone(dto: { name: string; description?: string; displayOrder: number; isActive: boolean; upazilaIds: number[] }): Observable<DeliveryZoneDto> {
    return this.api.post<DeliveryZoneDto>("/admin/locations/delivery-zones", dto);
  }

  updateDeliveryZone(id: number, dto: { name: string; description?: string; displayOrder: number; isActive: boolean; upazilaIds: number[] }): Observable<DeliveryZoneDto> {
    return this.api.put<DeliveryZoneDto>(`/admin/locations/delivery-zones/${id}`, dto);
  }

  deleteDeliveryZone(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/locations/delivery-zones/${id}`);
  }

  refresh(): void {
    this.getAll$ = null;
    this.cache.remove("locations", "all");
  }
}
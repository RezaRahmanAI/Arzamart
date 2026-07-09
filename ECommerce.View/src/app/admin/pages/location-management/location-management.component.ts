import { NgIf, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { LocationService } from "../../../core/services/location.service";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { DivisionDto, DistrictDto, UpazilaDto, DeliveryZoneDto, DeliveryZoneListDto, LocationHierarchy } from "../../../core/models/location";

@Component({
  selector: "app-admin-location-management",
  standalone: true,
  imports: [NgIf, NgClass, ReactiveFormsModule, AppIconComponent],
  templateUrl: "./location-management.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationManagementComponent implements OnInit, OnDestroy {
  private locationService = inject(LocationService);
  private fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);

  activeTab: "divisions" | "delivery-zones" = "divisions";
  divisions: DivisionDto[] = [];
  expandedDivisionId: number | null = null;
  expandedDistrictId: number | null = null;
  districtCache = new Map<number, DistrictDto[]>();
  upazilaCache = new Map<number, UpazilaDto[]>();
  deliveryZones: DeliveryZoneListDto[] = [];
  selectedZone: DeliveryZoneDto | null = null;
  selectedZoneUpazilas: Set<number> = new Set();

  isModalOpen = false;
  isEditing = false;
  selectedId: number | null = null;
  modalMode: "division" | "district" | "upazila" | "delivery-zone" = "division";
  parentDivisionId: number | null = null;
  parentDistrictId: number | null = null;
  isSubmitting = false;
  isLoading = false;

  // Hierarchy tree state for zone assignment
  hierarchyData: LocationHierarchy | null = null;
  zoneExpandedDivisions = new Set<number>();
  zoneExpandedDistricts = new Set<number>();

  locationForm = this.fb.group({
    nameEn: ["", [Validators.required, Validators.minLength(1)]],
    nameBn: [""],
    displayOrder: [0],
    isActive: [true],
  });

  zoneForm = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(1)]],
    description: [""],
    displayOrder: [0],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadDivisions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDivisions(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.locationService.getDivisions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (divisions) => {
          this.divisions = divisions;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadDeliveryZones(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.locationService.getDeliveryZones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (zones) => {
          this.deliveryZones = zones;
          this.selectedZone = null;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadHierarchy(): void {
    if (this.hierarchyData) return;
    this.locationService.getAllLocations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.hierarchyData = data;
          this.cdr.markForCheck();
        }
      });
  }

  switchTab(tab: "divisions" | "delivery-zones"): void {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      if (tab === "delivery-zones") {
        this.loadDeliveryZones();
      } else {
        this.loadDivisions();
      }
    }
  }

  toggleDivision(divisionId: number): void {
    if (this.expandedDivisionId === divisionId) {
      this.expandedDivisionId = null;
      this.expandedDistrictId = null;
      return;
    }
    this.expandedDivisionId = divisionId;
    this.expandedDistrictId = null;
    if (!this.districtCache.has(divisionId)) {
      this.locationService.getDistrictsByDivision(divisionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(districts => {
          this.districtCache.set(divisionId, districts);
          this.cdr.markForCheck();
        });
    }
  }

  toggleDistrict(districtId: number): void {
    if (this.expandedDistrictId === districtId) {
      this.expandedDistrictId = null;
      return;
    }
    this.expandedDistrictId = districtId;
    if (!this.upazilaCache.has(districtId)) {
      this.locationService.getUpazilasByDistrict(districtId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(upazilas => {
          this.upazilaCache.set(districtId, upazilas);
          this.cdr.markForCheck();
        });
    }
  }

  // --- Delivery Zone Modals ---

  openAddZoneModal(): void {
    this.isEditing = false;
    this.selectedId = null;
    this.modalMode = "delivery-zone";
    this.zoneForm.reset({ name: "", description: "", displayOrder: 0, isActive: true });
    this.selectedZoneUpazilas = new Set();
    this.isModalOpen = true;
    this.loadHierarchy();
    this.cdr.markForCheck();
  }

  openEditZoneModal(zoneId: number): void {
    this.isEditing = true;
    this.selectedId = zoneId;
    this.modalMode = "delivery-zone";
    this.locationService.getDeliveryZone(zoneId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (zone) => {
          this.zoneForm.patchValue({
            name: zone.name,
            description: zone.description,
            displayOrder: zone.displayOrder,
            isActive: zone.isActive,
          });
          this.selectedZoneUpazilas = new Set(zone.upazilaIds);
          this.isModalOpen = true;
          this.loadHierarchy();
          this.cdr.markForCheck();
        }
      });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.hierarchyData = null;
    this.zoneExpandedDivisions.clear();
    this.zoneExpandedDistricts.clear();
  }

  toggleZDivision(divId: number): void {
    if (this.zoneExpandedDivisions.has(divId)) {
      this.zoneExpandedDivisions.delete(divId);
    } else {
      this.zoneExpandedDivisions.add(divId);
    }
  }

  toggleZDistrict(distId: number): void {
    if (this.zoneExpandedDistricts.has(distId)) {
      this.zoneExpandedDistricts.delete(distId);
    } else {
      this.zoneExpandedDistricts.add(distId);
    }
  }

  toggleUpazilaSelection(upazilaId: number): void {
    if (this.selectedZoneUpazilas.has(upazilaId)) {
      this.selectedZoneUpazilas.delete(upazilaId);
    } else {
      this.selectedZoneUpazilas.add(upazilaId);
    }
  }

  areAllUpazilasSelected(upazilas: { id: number }[]): boolean {
    return upazilas.length > 0 && upazilas.every(u => this.selectedZoneUpazilas.has(u.id));
  }

  selectUpazilasInDistrict(districtId: number, upazilas: { id: number }[]): void {
    const allSelected = upazilas.every(u => this.selectedZoneUpazilas.has(u.id));
    if (allSelected) {
      upazilas.forEach(u => this.selectedZoneUpazilas.delete(u.id));
    } else {
      upazilas.forEach(u => this.selectedZoneUpazilas.add(u.id));
    }
  }

  onSubmitZone(): void {
    if (this.zoneForm.invalid) return;
    this.isSubmitting = true;
    this.cdr.markForCheck();

    const dto = {
      name: this.zoneForm.value.name!,
      description: this.zoneForm.value.description || undefined,
      displayOrder: this.zoneForm.value.displayOrder ?? 0,
      isActive: this.zoneForm.value.isActive ?? true,
      upazilaIds: Array.from(this.selectedZoneUpazilas),
    };

    const request = this.isEditing
      ? this.locationService.updateDeliveryZone(this.selectedId!, dto)
      : this.locationService.createDeliveryZone(dto);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        this.loadDeliveryZones();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteDeliveryZone(id: number): void {
    if (!confirm("Are you sure you want to delete this delivery zone?")) return;
    this.locationService.deleteDeliveryZone(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadDeliveryZones();
        }
      });
  }

  // --- Add Modal ---

  openAddModal(mode: "division" | "district" | "upazila", parentDivisionId?: number, parentDistrictId?: number): void {
    this.isEditing = false;
    this.selectedId = null;
    this.isModalOpen = true;
    this.modalMode = mode;
    this.parentDivisionId = parentDivisionId ?? null;
    this.parentDistrictId = parentDistrictId ?? null;
    this.locationForm.reset({ isActive: true, displayOrder: 0 });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.locationForm.invalid) return;
    this.isSubmitting = true;
    this.cdr.markForCheck();
  }

  trackById(_: number, item: any): number {
    return item.id;
  }
}

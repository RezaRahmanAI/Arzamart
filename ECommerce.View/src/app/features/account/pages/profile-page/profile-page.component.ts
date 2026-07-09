import { Component, ChangeDetectionStrategy, inject, OnDestroy, OnInit, ChangeDetectorRef, signal } from "@angular/core";
import { NgIf, AsyncPipe, DatePipe, NgFor } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CustomerProfileService, CustomerProfile } from "../../../../core/services/customer-profile.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { Order } from "../../../../core/models/order";
import { catchError, finalize, of, Subject, switchMap, takeUntil, tap } from "rxjs";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";
import { Router, ActivatedRoute, RouterModule } from "@angular/router";
import { AuthService } from "../../../../core/services/auth.service";
import { LocationService } from "../../../../core/services/location.service";
import { DivisionDto, DistrictDto, UpazilaDto } from "../../../../core/models/location";

@Component({
  selector: "app-profile-page",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, AsyncPipe, DatePipe, ReactiveFormsModule, AppIconComponent, RouterModule, NgFor],
  templateUrl: "./profile-page.component.html",
  styleUrl: "./profile-page.component.css",
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  private readonly profileService = inject(CustomerProfileService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  readonly imageUrlService = inject(ImageUrlService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly locationService = inject(LocationService);
  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  phone$ = this.profileService.phone$;
  isLoggedIn$ = this.authService.isLoggedIn$;
  orders: Order[] = [];
  isLoading = false;
  isSubmitting = false;
  saveSuccess = false;

  loginForm: FormGroup;
  profileForm: FormGroup;

  divisions = signal<DivisionDto[]>([]);
  districts = signal<DistrictDto[]>([]);
  upazilas = signal<UpazilaDto[]>([]);

  filteredDistricts: DistrictDto[] = [];
  filteredUpazilas: UpazilaDto[] = [];
  districtSearch = "";
  upazilaSearch = "";
  isDistrictDropdownOpen = false;
  isUpazilaDropdownOpen = false;

  selectedDivisionName = "";
  selectedDistrictName = "";
  selectedUpazilaName = "";

  get totalSpent(): number {
    return this.orders.reduce((sum, order) => sum + order.total, 0);
  }

  constructor() {
    this.loginForm = this.fb.group({
      phone: [
        "",
        [Validators.required, Validators.pattern(/^(?:\+88|01)?\d{11}$/)],
      ],
    });

    this.profileForm = this.fb.group({
      name: ["", Validators.required],
      phone: [{ value: "", disabled: true }],
      address: ["", Validators.required],
      divisionId: [0],
      districtId: [0],
      upazilaId: [0],
    });
  }

  ngOnInit(): void {
    this.locationService.getDivisions().subscribe((divisions) => {
      this.divisions.set(divisions);
    });

    this.profileService.phone$.pipe(takeUntil(this.destroy$)).subscribe((phone) => {
      if (phone && this.authService.isLoggedIn()) {
        this.loadData(phone);
      } else {
        this.orders = [];
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const phone = this.loginForm.get("phone")?.value;

    this.authService.customerPhoneLogin(phone).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        if (user) {
          this.profileService.storePhone(phone);
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/profile';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.loginForm.get("phone")?.setErrors({ invalidPhone: true });
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        console.error(err);
        this.loginForm.get("phone")?.setErrors({ serverError: true });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.profileService.clearPhone();
    this.orders = [];
    this.loginForm.reset();
    this.cdr.markForCheck();
    this.router.navigate(['/']);
  }

  loadData(phone: string): void {
    this.isLoading = true;

    this.profileService
      .getProfile(phone)
      .pipe(
        tap((profile) => {
          if (profile) {
            this.profileForm.patchValue({
              name: profile.name,
              phone: profile.phone,
              address: profile.address,
              divisionId: profile.divisionId ?? 0,
              districtId: profile.districtId ?? 0,
              upazilaId: profile.upazilaId ?? 0,
            });

            this.selectedDivisionName = profile.divisionName ?? "";
            this.selectedDistrictName = profile.districtName ?? "";
            this.selectedUpazilaName = profile.upazilaName ?? "";

            if (profile.divisionId) {
              this.loadDistrictsByDivision(profile.divisionId, profile.districtId, profile.upazilaId);
            }
          }
        }),
        catchError((err) => {
          if (err.status === 404) {
            this.profileForm.patchValue({ phone });
            this.cdr.markForCheck();
            return of(null);
          }
          return of(null);
        }),
        switchMap(() => this.profileService.getOrders(phone)),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe((orders) => {
        this.orders = orders || [];
        this.cdr.markForCheck();
      });
  }

  selectDivision(div: DivisionDto): void {
    this.profileForm.patchValue({
      divisionId: div.id,
      districtId: 0,
      upazilaId: 0,
    });
    this.selectedDivisionName = div.nameEn;
    this.selectedDistrictName = "";
    this.selectedUpazilaName = "";
    this.districtSearch = "";
    this.upazilaSearch = "";
    this.loadDistrictsByDivision(div.id, 0, 0);
  }

  private loadDistrictsByDivision(divisionId: number, selectDistrictId?: number, selectUpazilaId?: number): void {
    this.locationService.getDistrictsByDivision(divisionId).subscribe((districts) => {
      this.districts.set(districts);
      this.filteredDistricts = [...districts];

      if (selectDistrictId) {
        const dist = districts.find((d) => d.id === selectDistrictId);
        if (dist) {
          this.profileForm.patchValue({ districtId: dist.id });
          this.selectedDistrictName = dist.nameEn;
          this.districtSearch = dist.nameEn;
          this.loadUpazilasByDistrict(dist.id, selectUpazilaId);
        }
      }
      this.cdr.markForCheck();
    });
  }

  onDistrictSelected(district: DistrictDto): void {
    this.profileForm.patchValue({ districtId: district.id, upazilaId: 0 });
    this.selectedDistrictName = district.nameEn;
    this.districtSearch = district.nameEn;
    this.isDistrictDropdownOpen = false;
    this.upazilaSearch = "";
    this.selectedUpazilaName = "";
    this.loadUpazilasByDistrict(district.id, 0);
  }

  private loadUpazilasByDistrict(districtId: number, selectUpazilaId?: number): void {
    this.locationService.getUpazilasByDistrict(districtId).subscribe((upazilas) => {
      this.upazilas.set(upazilas);
      this.filteredUpazilas = [...upazilas];

      if (selectUpazilaId) {
        const upazila = upazilas.find((u) => u.id === selectUpazilaId);
        if (upazila) {
          this.profileForm.patchValue({ upazilaId: upazila.id });
          this.selectedUpazilaName = upazila.nameEn;
          this.upazilaSearch = upazila.nameEn;
        }
      }
      this.cdr.markForCheck();
    });
  }

  onUpazilaSelected(upazila: UpazilaDto): void {
    this.profileForm.patchValue({ upazilaId: upazila.id });
    this.selectedUpazilaName = upazila.nameEn;
    this.upazilaSearch = upazila.nameEn;
    this.isUpazilaDropdownOpen = false;
  }

  toggleDistrictDropdown(): void {
    this.isDistrictDropdownOpen = !this.isDistrictDropdownOpen;
    if (this.isDistrictDropdownOpen) {
      this.isUpazilaDropdownOpen = false;
      this.filteredDistricts = [...this.districts()];
      this.districtSearch = this.selectedDistrictName;
    }
  }

  filterDistricts(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.districtSearch = query;
    this.filteredDistricts = this.districts().filter((d) =>
      d.nameEn.toLowerCase().includes(query),
    );
  }

  toggleUpazilaDropdown(): void {
    if (!this.profileForm.get("districtId")?.value) return;
    this.isUpazilaDropdownOpen = !this.isUpazilaDropdownOpen;
    if (this.isUpazilaDropdownOpen) {
      this.isDistrictDropdownOpen = false;
      this.filteredUpazilas = [...this.upazilas()];
      this.upazilaSearch = this.selectedUpazilaName;
    }
  }

  filterUpazilas(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.upazilaSearch = query;
    this.filteredUpazilas = this.upazilas().filter((u) =>
      u.nameEn.toLowerCase().includes(query),
    );
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSubmitting = true;
    this.saveSuccess = false;

    const phone = this.profileService.getStoredPhone();
    if (!phone) return;

    const formValue = this.profileForm.getRawValue();
    const divisionId = formValue.divisionId || undefined;
    const districtId = formValue.districtId || undefined;
    const upazilaId = formValue.upazilaId || undefined;

    const division = this.divisions().find((d) => d.id === divisionId);
    const district = this.districts().find((d) => d.id === districtId);

    const request = {
      phone: phone,
      name: formValue.name,
      address: formValue.address,
      city: division?.nameEn ?? "",
      area: district?.nameEn ?? "",
      divisionId: divisionId,
      districtId: districtId,
      upazilaId: upazilaId,
    };

    this.profileService
      .updateProfile(request)
      .pipe(finalize(() => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (profile) => {
          this.saveSuccess = true;
          if (profile) {
            this.selectedDivisionName = profile.divisionName ?? this.selectedDivisionName;
            this.selectedDistrictName = profile.districtName ?? this.selectedDistrictName;
            this.selectedUpazilaName = profile.upazilaName ?? this.selectedUpazilaName;
          }
          this.cdr.markForCheck();
          this.successTimeout = setTimeout(() => {
            this.saveSuccess = false;
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (err) => {
          console.error("Failed to update profile", err);
        },
      });
  }
}

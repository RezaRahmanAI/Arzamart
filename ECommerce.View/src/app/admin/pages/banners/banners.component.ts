import { NgIf, NgFor } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { AdminBanner } from "../../models/banners.models";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { ProductService } from "../../../core/services/product.service";
import { BannerService } from "../../../core/services/banner.service";

@Component({
  selector: "app-admin-banners",
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, AppIconComponent, NgFor],
  templateUrl: "./banners.component.html",
})
export class BannersComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  readonly imageUrlService = inject(ImageUrlService);
  readonly authService = inject(AuthService);
  private productService = inject(ProductService);
  private publicBannerService = inject(BannerService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  banners: AdminBanner[] = [];
  isLoading = false;
  isModalOpen = false;
  isEditing = false;
  selectedBannerId: number | null = null;
  isSubmitting = false;
  currentTab: 'Hero' | 'Spotlight' | 'Promo' = 'Hero';

  get filteredBanners(): AdminBanner[] {
    return this.banners.filter(b => {
      if (this.currentTab === 'Hero') return b.type === 'Hero' || !b.type;
      return b.type === this.currentTab;
    });
  }

  bannerForm = this.fb.group({
    title: ["", [Validators.required]],
    subtitle: [""],
    imageUrl: ["", [Validators.required]],
    mobileImageUrl: [""],
    linkUrl: [""],
    buttonText: [""],
    displayOrder: [0, [Validators.required]],
    isActive: [true],
    type: ["Hero", [Validators.required]],
  });

  ngOnInit(): void {
    this.loadBanners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBanners(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.publicBannerService
      .getAllAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (banners) => {
          this.banners = banners;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err);
          this.cdr.markForCheck();
        }
      });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedBannerId = null;
    this.bannerForm.reset({
      title: "",
      subtitle: "",
      imageUrl: "",
      mobileImageUrl: "",
      linkUrl: "",
      buttonText: "",
      displayOrder: this.banners.filter(b => b.type === this.currentTab).length + 1,
      isActive: true,
      type: this.currentTab,
    });
    this.isModalOpen = true;
  }

  openEditModal(banner: AdminBanner): void {
    this.isEditing = true;
    this.selectedBannerId = banner.id;
    this.bannerForm.patchValue({
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl,
      mobileImageUrl: banner.mobileImageUrl,
      linkUrl: banner.linkUrl,
      buttonText: banner.buttonText,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      type: banner.type || "Hero",
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onFileSelected(event: any, type: "desktop" | "mobile"): void {
    const file = event.target.files[0];
    if (file) {
      this.publicBannerService.uploadImage(file).subscribe((res) => {
        if (type === "desktop") {
          this.bannerForm.patchValue({ imageUrl: res.url });
        } else {
          this.bannerForm.patchValue({ mobileImageUrl: res.url });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.bannerForm.invalid) {
      this.bannerForm.markAllAsTouched();
      const invalidFields: string[] = [];
      Object.keys(this.bannerForm.controls).forEach((key) => {
        if (this.bannerForm.get(key)?.invalid) invalidFields.push(key);
      });
      window.alert(
        `Please fill in all required fields: ${invalidFields.join(", ")}`,
      );
      return;
    }

    this.isSubmitting = true;
    const bannerData = this.bannerForm.value as any;

    if (this.isEditing && this.selectedBannerId) {
      this.publicBannerService.update(this.selectedBannerId, bannerData).subscribe({
        next: () => {
          this.refreshAllData();
          this.loadBanners();
          this.closeModal();
          this.isSubmitting = false;
        },
        error: () => (this.isSubmitting = false),
      });
    } else {
      this.publicBannerService.create(bannerData).subscribe({
        next: () => {
          this.refreshAllData();
          this.loadBanners();
          this.closeModal();
          this.isSubmitting = false;
        },
        error: () => (this.isSubmitting = false),
      });
    }
  }

  private refreshAllData(): void {
    // Notify all services that data has changed to clear caches
    this.productService.refreshData();
    this.publicBannerService.refresh();
  }

  deleteBanner(id: number): void {
    if (confirm("Are you sure you want to delete this banner?")) {
      this.publicBannerService.delete(id).subscribe(() => {
        this.refreshAllData();
        this.loadBanners();
      });
    }
  }

  getBannerImageUrl(url: string): string {
    return this.imageUrlService.getImageUrl(url);
  }

  setTab(tab: 'Hero' | 'Spotlight' | 'Promo'): void {
    this.currentTab = tab;
  }
}


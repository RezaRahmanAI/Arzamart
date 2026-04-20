import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { AdminBanner } from "../../models/banners.models";
import { AdminBannersService } from "../../services/admin-banners.service";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { ProductService } from "../../../core/services/product.service";
import { BannerService } from "../../../core/services/banner.service";

@Component({
  selector: "app-admin-banners",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: "./admin-banners.component.html",
})
export class AdminBannersComponent implements OnInit, OnDestroy {

  private bannersService = inject(AdminBannersService);
  private fb = inject(FormBuilder);
  readonly imageUrlService = inject(ImageUrlService);
  readonly authService = inject(AuthService);
  private productService = inject(ProductService);
  private publicBannerService = inject(BannerService);
  private destroy$ = new Subject<void>();

  banners: AdminBanner[] = [];
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
    this.bannersService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((banners) => {
        this.banners = banners;
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
      this.bannersService.uploadImage(file).subscribe((res) => {
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
      this.bannersService.update(this.selectedBannerId, bannerData).subscribe({
        next: () => {
          this.refreshAllData();
          this.loadBanners();
          this.closeModal();
          this.isSubmitting = false;
        },
        error: () => (this.isSubmitting = false),
      });
    } else {
      this.bannersService.create(bannerData).subscribe({
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
      this.bannersService.delete(id).subscribe(() => {
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

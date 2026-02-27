import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { AdminBanner } from "../../models/banners.models";
import { AdminBannersService } from "../../services/admin-banners.service";
import { ImageUrlService } from "../../../core/services/image-url.service";
import {
  LucideAngularModule,
  Plus,
  Edit,
  Trash2,
  Image,
  Monitor,
  Smartphone,
  Link,
  Type,
  ArrowUpDown,
  X,
  Upload,
  Loader2,
} from "lucide-angular";

@Component({
  selector: "app-admin-banners",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: "./admin-banners.component.html",
})
export class AdminBannersComponent implements OnInit, OnDestroy {
  readonly icons = {
    Plus,
    Edit,
    Trash2,
    Image,
    Monitor,
    Smartphone,
    Link,
    Type,
    ArrowUpDown,
    X,
    Upload,
    Loader2,
  };
  private bannersService = inject(AdminBannersService);
  private fb = inject(FormBuilder);
  readonly imageUrlService = inject(ImageUrlService);
  private destroy$ = new Subject<void>();

  banners: AdminBanner[] = [];
  isModalOpen = false;
  isEditing = false;
  selectedBannerId: number | null = null;
  isSubmitting = false;

  bannerForm = this.fb.group({
    title: ["", [Validators.required]],
    subtitle: [""],
    imageUrl: ["", [Validators.required]],
    mobileImageUrl: [""],
    linkUrl: [""],
    buttonText: [""],
    displayOrder: [0, [Validators.required]],
    isActive: [true],
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
      displayOrder: this.banners.length + 1,
      isActive: true,
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
      return;
    }

    this.isSubmitting = true;
    const bannerData = this.bannerForm.value as any;

    if (this.isEditing && this.selectedBannerId) {
      this.bannersService.update(this.selectedBannerId, bannerData).subscribe({
        next: () => {
          this.loadBanners();
          this.closeModal();
          this.isSubmitting = false;
        },
        error: () => (this.isSubmitting = false),
      });
    } else {
      this.bannersService.create(bannerData).subscribe({
        next: () => {
          this.loadBanners();
          this.closeModal();
          this.isSubmitting = false;
        },
        error: () => (this.isSubmitting = false),
      });
    }
  }

  deleteBanner(id: number): void {
    if (confirm("Are you sure you want to delete this banner?")) {
      this.bannersService.delete(id).subscribe(() => {
        this.loadBanners();
      });
    }
  }

  getBannerImageUrl(url: string): string {
    return this.imageUrlService.getImageUrl(url);
  }
}

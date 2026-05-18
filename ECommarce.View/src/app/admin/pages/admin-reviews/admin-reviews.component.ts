import { NgIf, NgClass, DatePipe, NgFor } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, HostListener } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { AdminReview } from "../../models/reviews.models";
import { AdminReviewsService } from "../../services/admin-reviews.service";
import { AuthService } from "../../../core/services/auth.service";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";
import { ProductsService } from "../../services/products.service";
import { AdminProduct } from "../../models/products.models";
import { environment } from "../../../../environments/environment";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-admin-reviews",
  standalone: true,
  imports: [NgIf, NgClass, DatePipe, ReactiveFormsModule, FormsModule, AppIconComponent, NgFor],
  templateUrl: "./admin-reviews.component.html",
  styleUrl: "./admin-reviews.component.css",
})
export class AdminReviewsComponent implements OnInit, OnDestroy {

  private reviewsService = inject(AdminReviewsService);
  private productsService = inject(ProductsService);
  private fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private notification = inject(NotificationService);
  private destroy$ = new Subject<void>();

  reviews: AdminReview[] = [];
  products: AdminProduct[] = [];
  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedReviewId: number | null = null;
  isSubmitting = false;
  isUploadingAvatar = false;

  // Searchable Dropdown
  productSearchTerm = "";
  isProductDropdownOpen = false;

  get filteredProducts(): AdminProduct[] {
    if (!this.productSearchTerm) return this.products;
    const term = this.productSearchTerm.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.sku && p.sku.toLowerCase().includes(term))
    );
  }

  get selectedProductName(): string {
    const id = this.reviewForm.get('productId')?.value;
    if (!id) return "SELECT PRODUCT";
    const product = this.products.find(p => p.id === id);
    return product ? `${product.name} (${product.sku})` : "SELECT PRODUCT";
  }

  reviewForm = this.fb.group({
    userName: ["", [Validators.required]],
    userAvatar: [""],
    productId: [null as number | null, [Validators.required]],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: [""],
    isVerifiedPurchase: [true],
    screenshotUrl: [""],
  });

  isUploadingScreenshot = false;

  ngOnInit(): void {
    this.loadReviews();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReviews(): void {
    this.reviewsService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((reviews) => {
        this.reviews = reviews;
      });
  }

  loadProducts(): void {
    this.productsService.getCatalogProducts().pipe(takeUntil(this.destroy$)).subscribe(products => {
      this.products = products;
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedReviewId = null;
    this.reviewForm.reset({
      rating: 5,
      comment: "",
      isVerifiedPurchase: true,
      userName: "",
      userAvatar: "",
      productId: null,
      screenshotUrl: ""
    });
    this.isModalOpen = true;
  }

  openEditModal(review: AdminReview): void {
    this.modalMode = 'edit';
    this.selectedReviewId = review.id;
    this.reviewForm.patchValue({
      userName: review.userName,
      userAvatar: review.userAvatar,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      screenshotUrl: review.screenshotUrl || "",
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isProductDropdownOpen = false;
    this.productSearchTerm = "";
  }

  toggleProductDropdown(event: Event): void {
    event.stopPropagation();
    this.isProductDropdownOpen = !this.isProductDropdownOpen;
    if (this.isProductDropdownOpen) this.productSearchTerm = "";
  }

  selectProduct(product: AdminProduct): void {
    this.reviewForm.patchValue({ productId: product.id });
    this.isProductDropdownOpen = false;
    this.productSearchTerm = "";
  }

  onAvatarFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploadingAvatar = true;
    this.productsService.uploadProductMedia([file]).subscribe({
      next: (urls) => {
        if (urls && urls.length > 0) {
          this.reviewForm.patchValue({ userAvatar: urls[0] });
        }
        this.isUploadingAvatar = false;
      },
      error: () => {
        this.isUploadingAvatar = false;
      }
    });
  }

  onScreenshotFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploadingScreenshot = true;
    this.productsService.uploadProductMedia([file]).subscribe({
      next: (urls) => {
        if (urls && urls.length > 0) {
          this.reviewForm.patchValue({ screenshotUrl: urls[0] });
        }
        this.isUploadingScreenshot = false;
      },
      error: () => {
        this.isUploadingScreenshot = false;
        this.notification.error("Failed to upload screenshot.");
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isProductDropdownOpen) {
      this.isProductDropdownOpen = false;
    }
  }

  onSubmit(): void {
    if (this.reviewForm.invalid || (this.modalMode === 'edit' && !this.selectedReviewId)) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const reviewData = this.reviewForm.value as any;

    const request$ = this.modalMode === 'create' 
      ? this.reviewsService.create(reviewData)
      : this.reviewsService.update(this.selectedReviewId!, reviewData);

    request$.subscribe({
      next: () => {
        this.loadReviews();
        this.closeModal();
        this.isSubmitting = false;
        this.notification.success(this.modalMode === 'create' ? "Feedback entry established successfully." : "Feedback entry synchronized.");
      },
      error: (err) => {
        this.isSubmitting = false;
        const errorMsg = err.error?.message || "Operational anomaly detected during synchronization.";
        this.notification.error(errorMsg);
      },
    });
  }

  deleteReview(id: number): void {
    if (confirm("Are you sure you want to delete this review?")) {
      this.reviewsService.delete(id).subscribe(() => {
        this.loadReviews();
      });
    }
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  getImageUrl(path: string | undefined | null): string {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = environment.apiBaseUrl.replace("/api", "");
    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  }
}


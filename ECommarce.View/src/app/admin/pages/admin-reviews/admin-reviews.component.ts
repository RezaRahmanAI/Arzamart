import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { AdminReview } from "../../models/reviews.models";
import { AdminReviewsService } from "../../services/admin-reviews.service";
import {
  LucideAngularModule,
  Star,
  User,
  CheckCircle2,
  ShoppingBag,
  ThumbsUp,
  Edit,
  Trash2,
  X,
  MessageSquare,
} from "lucide-angular";

@Component({
  selector: "app-admin-reviews",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: "./admin-reviews.component.html",
})
export class AdminReviewsComponent implements OnInit, OnDestroy {
  readonly icons = {
    Star,
    User,
    CheckCircle2,
    ShoppingBag,
    ThumbsUp,
    Edit,
    Trash2,
    X,
    MessageSquare,
  };
  private reviewsService = inject(AdminReviewsService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  reviews: AdminReview[] = [];
  isModalOpen = false;
  selectedReviewId: number | null = null;
  isSubmitting = false;

  reviewForm = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ["", [Validators.required]],
  });

  ngOnInit(): void {
    this.loadReviews();
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

  openEditModal(review: AdminReview): void {
    this.selectedReviewId = review.id;
    this.reviewForm.patchValue({
      rating: review.rating,
      comment: review.comment,
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSubmit(): void {
    if (this.reviewForm.invalid || !this.selectedReviewId) {
      return;
    }

    this.isSubmitting = true;
    const reviewData = this.reviewForm.value as any;

    this.reviewsService.update(this.selectedReviewId, reviewData).subscribe({
      next: () => {
        this.loadReviews();
        this.closeModal();
        this.isSubmitting = false;
      },
      error: () => (this.isSubmitting = false),
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
}

import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReviewService } from "../../../../core/services/review.service";
import { Review } from "../../../../core/models/review";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-testimonials",
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: "./testimonials.component.html",
  styleUrl: "./testimonials.component.css",
})
export class TestimonialsComponent implements OnInit {
  reviews: Review[] = [];
  stars = [1, 2, 3, 4, 5];

  private readonly reviewService = inject(ReviewService);
  readonly imageUrlService = inject(ImageUrlService);

  ngOnInit(): void {
    this.reviewService.getFeaturedReviews().subscribe((reviews) => {
      this.reviews = reviews;
    });
  }

  getStarIcon(rating: number, star: number): string {
    if (rating >= star) {
      return 'Star';
    }

    if (rating + 0.5 >= star) {
      return 'StarHalf';
    }

    return 'Star';
  }
}
